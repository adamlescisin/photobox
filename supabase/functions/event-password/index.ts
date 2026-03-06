import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- PBKDF2 password hashing with random salt ---
async function hashPassword(password: string, salt?: Uint8Array): Promise<{ salt: string; hash: string }> {
  const encoder = new TextEncoder();
  if (!salt) {
    salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");

  return { salt: saltHex, hash: hashHex };
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// --- In-memory rate limiting ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 attempts per minute per key

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, event_id, password, slug } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ACTION: hash — sets password_hash on event (admin only)
    if (action === "hash") {
      // Verify caller is authenticated admin
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: isAdmin } = await userClient.rpc("is_admin");
      const { data: isManager } = event_id
        ? await userClient.rpc("is_event_manager_or_admin", { _event_id: event_id })
        : { data: false };

      if (!isAdmin && !isManager) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!event_id) {
        return new Response(JSON.stringify({ error: "event_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let passwordHash: string | null = null;
      if (password) {
        const { salt, hash } = await hashPassword(password);
        // Store as "salt:hash" format
        passwordHash = `${salt}:${hash}`;
      }

      const { error } = await supabase
        .from("events")
        .update({ password_hash: passwordHash })
        .eq("id", event_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, protected: !!password }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: verify — checks password for public gallery access
    if (action === "verify") {
      if (!slug && !event_id) {
        return new Response(JSON.stringify({ error: "slug or event_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Rate limiting by IP + identifier
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const rateLimitKey = `${clientIp}:${slug || event_id}`;
      if (isRateLimited(rateLimitKey)) {
        return new Response(
          JSON.stringify({ error: "Too many attempts. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
          }
        );
      }

      let query = supabase.from("events").select("id, password_hash");
      if (slug) query = query.eq("slug", slug);
      else query = query.eq("id", event_id);

      const { data: event, error } = await query.single();
      if (error || !event) {
        return new Response(JSON.stringify({ error: "Event not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!event.password_hash) {
        return new Response(
          JSON.stringify({ valid: true, message: "No password required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Support both new "salt:hash" format and legacy plain SHA-256 hashes
      let valid = false;
      const storedHash = event.password_hash;

      if (storedHash.includes(":")) {
        // New PBKDF2 format: "salt:hash"
        const [saltHex, expectedHash] = storedHash.split(":");
        const salt = hexToBytes(saltHex);
        const { hash: inputHash } = await hashPassword(password || "", salt);
        valid = inputHash === expectedHash;
      } else {
        // Legacy SHA-256 format (for backwards compatibility during migration)
        const encoder = new TextEncoder();
        const data = encoder.encode(password || "");
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const inputHash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        valid = inputHash === storedHash;
      }

      return new Response(
        JSON.stringify({ valid }),
        {
          status: valid ? 200 : 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
