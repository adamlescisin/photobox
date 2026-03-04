import { useParams, Link } from "react-router-dom";
import { useEvent, useUpdateEvent } from "@/hooks/useEvents";
import { usePhotos, useDeletePhoto, useTogglePhotoHidden } from "@/hooks/usePhotos";
import { Camera, QrCode, Palette, ArrowLeft, Copy, Lock, LockOpen, Aperture, Pencil, Check, X, CalendarOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import PhotoGrid from "@/components/PhotoGrid";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { setEventPassword } from "@/lib/event-password";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, addDays } from "date-fns";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const { data: photos } = usePhotos(id);
  const deletePhoto = useDeletePhoto();
  const toggleHidden = useTogglePhotoHidden();
  const updateEvent = useUpdateEvent();
  const [showQR, setShowQR] = useState(false);
  const [pwEnabled, setPwEnabled] = useState(false);
  const [pwValue, setPwValue] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwInitialized, setPwInitialized] = useState(false);

  // Inline editing state
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [editDate, setEditDate] = useState("");

  // Expiration state
  const [expirationInitialized, setExpirationInitialized] = useState(false);
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  // Sync password toggle with event data
  if (event && !pwInitialized) {
    setPwEnabled(!!event.password_hash);
    setPwInitialized(true);
  }

  // Sync expiration with event data
  if (event && !expirationInitialized) {
    setExpirationEnabled(!!event.expires_at);
    setExpiresAt(event.expires_at || format(addDays(new Date(event.date), 30), "yyyy-MM-dd"));
    setExpirationInitialized(true);
  }

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse py-20 text-center">Načítání…</div>;
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Akce nenalezena.</p>
      </div>
    );
  }

  const galleryUrl = `${window.location.origin}/g/${event.slug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(galleryUrl);
    toast.success("URL zkopírována do schránky");
  };

  const handleDelete = async (photoId: string) => {
    await deletePhoto.mutateAsync(photoId);
    toast.success("Fotka smazána");
  };

  const handleToggleHide = async (photoId: string) => {
    const photo = photos?.find((p) => p.id === photoId);
    if (!photo) return;
    await toggleHidden.mutateAsync({ id: photoId, hidden: !photo.hidden });
    toast.success("Viditelnost změněna");
  };

  const handlePasswordSave = async () => {
    if (!id) return;
    setPwSaving(true);
    try {
      await setEventPassword(id, pwEnabled ? pwValue || null : null);
      toast.success(pwEnabled ? "Heslo nastaveno" : "Ochrana heslem odstraněna");
      setPwValue("");
    } catch {
      toast.error("Nepodařilo se uložit heslo");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="font-display text-2xl font-bold bg-secondary border border-border rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                autoFocus
              />
              <button onClick={async () => {
                if (!editName.trim() || !id) return;
                await updateEvent.mutateAsync({ id, name: editName.trim() });
                setEditingName(false);
                toast.success("Název aktualizován");
              }} className="text-primary hover:text-primary/80"><Check className="h-5 w-5" /></button>
              <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="font-display text-2xl font-bold">{event.name}</h1>
              <button onClick={() => { setEditName(event.name); setEditingName(true); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"><Pencil className="h-4 w-4" /></button>
            </div>
          )}
          {editingDate ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="text-sm bg-secondary border border-border rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button onClick={async () => {
                if (!editDate || !id) return;
                await updateEvent.mutateAsync({ id, date: editDate });
                setEditingDate(false);
                toast.success("Datum aktualizováno");
              }} className="text-primary hover:text-primary/80"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditingDate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <p className="text-sm text-muted-foreground">{event.date}</p>
              <button onClick={() => { setEditDate(event.date); setEditingDate(true); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"><Pencil className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-glow hover:border-primary/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium">QR kód</span>
        </button>

        <Link
          to={`/g/${event.slug}`}
          target="_blank"
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-glow hover:border-primary/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Copy className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium">Galerie</span>
        </Link>

        <Link
          to={`/g/${event.slug}/action`}
          target="_blank"
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-glow hover:border-primary/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Aperture className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium">Action!</span>
        </Link>

        <Link
          to={`/admin/events/${id}/style`}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-glow hover:border-primary/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium">Styling</span>
        </Link>
      </div>

      {showQR && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-col items-center rounded-xl border border-border bg-card p-6"
        >
          <div className="rounded-xl bg-foreground p-4">
            <QRCodeSVG value={galleryUrl} size={200} bgColor="hsl(45, 10%, 95%)" fgColor="hsl(220, 20%, 6%)" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{galleryUrl}</p>
          <button
            onClick={handleCopyUrl}
            className="mt-2 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors"
          >
            Kopírovat URL
          </button>
        </motion.div>
      )}

      {/* Password Management */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pwEnabled ? <Lock className="h-4 w-4 text-primary" /> : <LockOpen className="h-4 w-4 text-muted-foreground" />}
            <Label>Ochrana heslem</Label>
          </div>
          <Switch checked={pwEnabled} onCheckedChange={setPwEnabled} />
        </div>
        {pwEnabled && (
          <input
            type="password"
            value={pwValue}
            onChange={(e) => setPwValue(e.target.value)}
            placeholder="Nové heslo (ponechte prázdné pro zachování)"
            className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )}
        <button
          onClick={handlePasswordSave}
          disabled={pwSaving}
          className="rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {pwSaving ? "Ukládání…" : "Uložit heslo"}
        </button>
      </div>

      {/* Expiration Management */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOff className={`h-4 w-4 ${expirationEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label>Expirace galerie</Label>
          </div>
          <Switch checked={expirationEnabled} onCheckedChange={setExpirationEnabled} />
        </div>
        {expirationEnabled && (
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )}
        <button
          onClick={async () => {
            if (!id) return;
            try {
              await updateEvent.mutateAsync({ id, expires_at: expirationEnabled ? expiresAt : null });
              toast.success(expirationEnabled ? "Expirace nastavena" : "Expirace odstraněna");
            } catch {
              toast.error("Nepodařilo se uložit expiraci");
            }
          }}
          className="rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors"
        >
          Uložit expiraci
        </button>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold mb-3">
          Fotky ({photos?.length ?? 0})
        </h2>
        {photos && photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            eventSlug={event.slug}
            isAdmin
            onDelete={handleDelete}
            onToggleHide={handleToggleHide}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Žádné fotky.</p>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
