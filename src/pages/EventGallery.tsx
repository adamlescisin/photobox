import { useParams } from "react-router-dom";
import { useEventBySlug, useEventStyle } from "@/hooks/useEvents";
import { usePhotos } from "@/hooks/usePhotos";
import EventHeader from "@/components/EventHeader";
import PhotoGrid from "@/components/PhotoGrid";
import { Camera } from "lucide-react";

const EventGallery = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug);
  const { data: style } = useEventStyle(event?.id);
  const { data: photos } = usePhotos(event?.id);

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

  const visiblePhotos = photos?.filter((p) => !p.hidden) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <EventHeader event={event} style={style} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {visiblePhotos.length} {visiblePhotos.length === 1 ? "fotka" : visiblePhotos.length < 5 ? "fotky" : "fotek"}
          </p>
        </div>
        {visiblePhotos.length > 0 ? (
          <PhotoGrid photos={visiblePhotos} eventSlug={event.slug} />
        ) : (
          <p className="text-center text-muted-foreground py-12">Zatím žádné fotky.</p>
        )}
      </div>
    </div>
  );
};

export default EventGallery;
