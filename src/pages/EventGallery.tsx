import { useParams } from "react-router-dom";
import { useEventBySlug, useEventStyle } from "@/hooks/useEvents";
import { usePhotos } from "@/hooks/usePhotos";
import { verifyEventPassword } from "@/lib/event-password";
import EventHeader from "@/components/EventHeader";
import PhotoGrid from "@/components/PhotoGrid";
import { Camera, Lock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import PhotoSelectionToolbar from "@/components/PhotoSelectionToolbar";

const EventGallery = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug);
  const { data: style } = useEventStyle(event?.id);
  const { data: photos } = usePhotos(event?.id);

  const [needsPassword, setNeedsPassword] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event?.password_hash) {
      // Check session storage for previously verified
      const key = `event_unlocked_${event.id}`;
      if (sessionStorage.getItem(key) === "true") {
        setUnlocked(true);
      } else {
        setNeedsPassword(true);
      }
    } else if (event) {
      setUnlocked(true);
    }
  }, [event]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setVerifying(true);
    setError("");
    try {
      const valid = await verifyEventPassword(slug, password);
      if (valid) {
        setUnlocked(true);
        setNeedsPassword(false);
        if (event) sessionStorage.setItem(`event_unlocked_${event.id}`, "true");
      } else {
        setError("Nesprávné heslo");
      }
    } catch {
      setError("Chyba při ověřování");
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Načítání galerie…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold">Akce nenalezena</h1>
          <p className="text-muted-foreground mt-2">Zkontrolujte prosím URL adresu.</p>
        </div>
      </div>
    );
  }

  // Check expiration
  const isExpired = event.expires_at && new Date(event.expires_at) < new Date();
  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">Galerie není aktivní</h1>
          <p className="text-sm text-muted-foreground">
            Omlouváme se, ale tato galerie již není dostupná. Platnost galerie vypršela.
          </p>
        </div>
      </div>
    );
  }

  if (needsPassword && !unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{event.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Tato galerie je chráněna heslem</p>
          </div>
          <form onSubmit={handleVerify} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Zadejte heslo"
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-xl gradient-accent py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {verifying ? "Ověřování…" : "Odemknout"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const visiblePhotos = photos?.filter((p) => !p.hidden) ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectionMode = selectedIds.size > 0;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === visiblePhotos.length ? new Set() : new Set(visiblePhotos.map((p) => p.id))
    );
  }, [visiblePhotos]);

  return (
    <div className="min-h-screen bg-background">
      <EventHeader event={event} style={style} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {visiblePhotos.length} {visiblePhotos.length === 1 ? "fotka" : visiblePhotos.length < 5 ? "fotky" : "fotek"}
          </p>
        </div>
        <PhotoSelectionToolbar
          selectedIds={selectedIds}
          photos={visiblePhotos}
          onClear={() => setSelectedIds(new Set())}
          onSelectAll={selectAll}
          totalCount={visiblePhotos.length}
        />
        {visiblePhotos.length > 0 ? (
          <PhotoGrid
            photos={visiblePhotos}
            eventSlug={event.slug}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        ) : (
          <p className="text-center text-muted-foreground py-12">Zatím žádné fotky.</p>
        )}
      </div>
    </div>
  );
};

export default EventGallery;
