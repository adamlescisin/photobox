import { useParams, Link } from "react-router-dom";
import { useEvent } from "@/hooks/useEvents";
import { usePhotos, useDeletePhoto, useTogglePhotoHidden } from "@/hooks/usePhotos";
import { Camera, QrCode, Palette, ArrowLeft, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import PhotoGrid from "@/components/PhotoGrid";
import { motion } from "framer-motion";
import { toast } from "sonner";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const { data: photos } = usePhotos(id);
  const deletePhoto = useDeletePhoto();
  const toggleHidden = useTogglePhotoHidden();
  const [showQR, setShowQR] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">{event.name}</h1>
          <p className="text-sm text-muted-foreground">{event.date}</p>
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

        <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-glow hover:border-primary/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium">Styling</span>
        </button>
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
