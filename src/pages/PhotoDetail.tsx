import { useParams, Link } from "react-router-dom";
import { mockEvents, generateMockPhotos } from "@/lib/mock-data";
import { ArrowLeft, Download } from "lucide-react";
import { motion } from "framer-motion";

const PhotoDetail = () => {
  const { slug, photoId } = useParams<{ slug: string; photoId: string }>();
  const event = mockEvents.find((e) => e.slug === slug);

  if (!event) return null;

  const photos = generateMockPhotos(event.id, event.photoCount);
  const photo = photos.find((p) => p.id === photoId);

  if (!photo) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link
          to={`/g/${slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět do galerie
        </Link>
        <a
          href={photo.originalUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg gradient-accent px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        >
          <Download className="h-4 w-4" />
          Stáhnout
        </a>
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <motion.img
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          src={photo.originalUrl}
          alt={photo.caption || "Fotka"}
          className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-card"
        />
      </div>
      {photo.caption && (
        <div className="text-center pb-6">
          <p className="text-sm text-muted-foreground">{photo.caption}</p>
        </div>
      )}
    </div>
  );
};

export default PhotoDetail;
