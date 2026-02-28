import { Photo } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface PhotoGridProps {
  photos: Photo[];
  eventSlug: string;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onToggleHide?: (id: string) => void;
}

const PhotoGrid = ({ photos, eventSlug, isAdmin, onDelete, onToggleHide }: PhotoGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03, duration: 0.3 }}
          className="group relative aspect-square overflow-hidden rounded-lg bg-secondary"
        >
          <Link to={isAdmin ? "#" : `/g/${eventSlug}/p/${photo.id}`}>
            <img
              src={photo.thumbnailUrl}
              alt={photo.caption || `Fotka ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          {photo.hidden && (
            <div className="absolute top-2 left-2 rounded-md bg-muted/90 px-2 py-0.5 text-xs text-muted-foreground">
              Skrytá
            </div>
          )}
          {isAdmin && (
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onToggleHide?.(photo.id)}
                className="rounded-md bg-secondary/90 px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary"
              >
                {photo.hidden ? "Zobrazit" : "Skrýt"}
              </button>
              <button
                onClick={() => onDelete?.(photo.id)}
                className="rounded-md bg-destructive/90 px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive"
              >
                Smazat
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default PhotoGrid;
