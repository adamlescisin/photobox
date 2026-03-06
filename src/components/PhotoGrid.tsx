import type { Photo } from "@/hooks/usePhotos";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

interface PhotoGridProps {
  photos: Photo[];
  eventSlug: string;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onToggleHide?: (id: string) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

const PhotoGrid = ({
  photos,
  eventSlug,
  isAdmin,
  onDelete,
  onToggleHide,
  selectionMode,
  selectedIds,
  onToggleSelect,
}: PhotoGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
      {photos.map((photo, index) => {
        const isSelected = selectedIds?.has(photo.id) ?? false;

        return (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            className={`group relative aspect-square overflow-hidden rounded-lg bg-secondary cursor-pointer ${
              isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
            }`}
            onClick={selectionMode ? () => onToggleSelect?.(photo.id) : undefined}
          >
            {selectionMode ? (
              <>
                <img
                  src={photo.thumbnail_url}
                  alt={photo.caption || `Fotka ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground/40 bg-background/60"
                  }`}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
              </>
            ) : (
              <Link to={isAdmin ? "#" : `/g/${eventSlug}/p/${photo.id}`}>
                <img
                  src={photo.thumbnail_url}
                  alt={photo.caption || `Fotka ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
            {/* Long-press / click to enter selection mode on non-selection */}
            {!selectionMode && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSelect?.(photo.id);
                }}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md border-2 border-foreground/30 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            )}
            {photo.hidden && (
              <div className="absolute top-2 left-2 rounded-md bg-muted/90 px-2 py-0.5 text-xs text-muted-foreground">
                Skrytá
              </div>
            )}
            {isAdmin && !selectionMode && (
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
        );
      })}
    </div>
  );
};

export default PhotoGrid;
