import { useParams } from "react-router-dom";
import { mockEvents, generateMockPhotos } from "@/lib/mock-data";
import EventHeader from "@/components/EventHeader";
import PhotoGrid from "@/components/PhotoGrid";
import { Camera } from "lucide-react";

const EventGallery = () => {
  const { slug } = useParams<{ slug: string }>();
  const event = mockEvents.find((e) => e.slug === slug);

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

  const photos = generateMockPhotos(event.id, event.photoCount).filter((p) => !p.hidden);

  return (
    <div className="min-h-screen bg-background">
      <EventHeader event={event} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {photos.length} {photos.length === 1 ? "fotka" : photos.length < 5 ? "fotky" : "fotek"}
          </p>
        </div>
        <PhotoGrid photos={photos} eventSlug={event.slug} />
      </div>
    </div>
  );
};

export default EventGallery;
