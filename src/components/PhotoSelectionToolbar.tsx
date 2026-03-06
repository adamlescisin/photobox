import { Download, X, CheckSquare } from "lucide-react";
import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import type { Photo } from "@/hooks/usePhotos";

interface Props {
  selectedIds: Set<string>;
  photos: Photo[];
  onClear: () => void;
  onSelectAll: () => void;
  totalCount: number;
}

const PhotoSelectionToolbar = ({ selectedIds, photos, onClear, onSelectAll, totalCount }: Props) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const selected = photos.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;

    if (selected.length === 1) {
      // Single file – direct download
      try {
        const res = await fetch(selected[0].original_url);
        const blob = await res.blob();
        const ext = selected[0].original_url.split(".").pop()?.split("?")[0] || "jpg";
        saveAs(blob, `photo.${ext}`);
      } catch {
        toast.error("Nepodařilo se stáhnout fotku");
      }
      return;
    }

    setDownloading(true);
    try {
      const zip = new JSZip();
      const promises = selected.map(async (photo, i) => {
        const res = await fetch(photo.original_url);
        const blob = await res.blob();
        const ext = photo.original_url.split(".").pop()?.split("?")[0] || "jpg";
        zip.file(`photo_${i + 1}.${ext}`, blob);
      });
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "fotky.zip");
      toast.success(`Staženo ${selected.length} fotek`);
    } catch {
      toast.error("Nepodařilo se stáhnout fotky");
    } finally {
      setDownloading(false);
    }
  };

  if (selectedIds.size === 0) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 backdrop-blur px-4 py-3 shadow-lg mb-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedIds.size} / {totalCount} vybráno
        </span>
        <button
          onClick={onSelectAll}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted transition-colors"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          {selectedIds.size === totalCount ? "Zrušit vše" : "Vybrat vše"}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 rounded-lg gradient-accent px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? "Stahuji…" : "Stáhnout"}
        </button>
        <button
          onClick={onClear}
          className="rounded-lg bg-secondary p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PhotoSelectionToolbar;
