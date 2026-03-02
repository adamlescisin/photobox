import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/event-password`;

export const verifyEventPassword = async (slug: string, password: string) => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", slug, password }),
  });
  const data = await res.json();
  return data.valid === true;
};

export const setEventPassword = async (eventId: string, password: string | null) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ action: "hash", event_id: eventId, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to set password");
  return data;
};
