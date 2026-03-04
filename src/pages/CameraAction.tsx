import { useParams } from "react-router-dom";
import { useEventBySlug, useEventStyle } from "@/hooks/useEvents";
import { usePhotos } from "@/hooks/usePhotos";
import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Camera, RotateCcw, Images, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { removeBackground } from "@imgly/background-removal";

type Phase = "viewfinder" | "countdown" | "uploading" | "result" | "gallery";

const CameraAction = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug);
  const { data: style } = useEventStyle(event?.id);
  const { data: photos } = usePhotos(event?.id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("viewfinder");
  const [countdown, setCountdown] = useState(3);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Nepodařilo se spustit kameru");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const startCountdown = () => {
    setPhase("countdown");
    setCountdown(3);
    let c = 3;
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        capturePhoto();
      }
    }, 1000);
  };

  /** Load an image from URL and return it as HTMLImageElement */
  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  /** Draw watermark elements onto a canvas based on event style settings */
  const applyWatermark = async (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    if (!style || !event) return;

    const padding = Math.round(w * 0.03);
    const fontSize = Math.round(w * 0.025);
    ctx.font = `600 ${fontSize}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 4;

    // Frame
    if (style.watermark_show_frame) {
      const inset = Math.round(w * 0.02);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = Math.max(2, Math.round(w * 0.003));
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    }

    let bottomY = h - padding;

    // Date (bottom-right)
    if (style.watermark_show_date) {
      ctx.textAlign = "right";
      ctx.fillText(event.date, w - padding, bottomY);
    }

    // Name (bottom-left)
    if (style.watermark_show_name) {
      ctx.textAlign = "left";
      ctx.fillText(event.name, padding, bottomY);
    }

    // Logo (top-right corner)
    if (style.watermark_show_logo && style.logo_url) {
      try {
        const logoImg = await loadImage(style.logo_url);
        const logoH = Math.round(h * 0.08);
        const logoW = Math.round((logoImg.width / logoImg.height) * logoH);
        ctx.shadowBlur = 0;
        ctx.drawImage(logoImg, w - padding - logoW, padding, logoW, logoH);
      } catch {
        // logo load failed – skip
      }
    }

    // Custom watermark image (center)
    if (style.watermark_url) {
      try {
        const wmImg = await loadImage(style.watermark_url);
        const wmH = Math.round(h * 0.12);
        const wmW = Math.round((wmImg.width / wmImg.height) * wmH);
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = 0;
        ctx.drawImage(wmImg, (w - wmW) / 2, (h - wmH) / 2, wmW, wmH);
        ctx.globalAlpha = 1;
      } catch {
        // watermark load failed – skip
      }
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !event) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const shouldRemoveBg = (style as any)?.remove_background === true;

    if (shouldRemoveBg) {
      setPhase("uploading");

      // Capture raw frame to a temp canvas
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(video, 0, 0);

      try {
        // Get raw frame as blob
        const rawBlob = await new Promise<Blob>((res) =>
          tempCanvas.toBlob((b) => res(b!), "image/png")
        );

        // Remove background
        const fgBlob = await removeBackground(rawBlob);
        const fgImg = await loadImage(URL.createObjectURL(fgBlob));

        // Draw custom background or solid color
        if (style?.background_image_url) {
          try {
            const bgImg = await loadImage(style.background_image_url);
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
          } catch {
            ctx.fillStyle = style?.primary_color ? `hsl(${style.primary_color})` : "#1a1a2e";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          ctx.fillStyle = style?.primary_color ? `hsl(${style.primary_color})` : "#1a1a2e";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw foreground (person) on top
        ctx.drawImage(fgImg, 0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.error("Background removal failed, using original:", err);
        ctx.drawImage(video, 0, 0);
      }
    } else {
      ctx.drawImage(video, 0, 0);
    }

    // Apply watermark onto the canvas before exporting
    await applyWatermark(ctx, canvas.width, canvas.height);

    if (!shouldRemoveBg) {
      setPhase("uploading");
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error("Nepodařilo se zachytit snímek");
        setPhase("viewfinder");
        return;
      }

      const ts = Date.now();
      const fileName = `${ts}.jpg`;
      const originalPath = `${event.id}/originals/${fileName}`;
      const thumbPath = `${event.id}/thumbnails/${fileName}`;

      try {
        const { error: upErr } = await supabase.storage
          .from("event-photos")
          .upload(originalPath, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;

        // Create thumbnail
        const thumbCanvas = document.createElement("canvas");
        const maxThumb = 400;
        const scale = Math.min(maxThumb / canvas.width, maxThumb / canvas.height, 1);
        thumbCanvas.width = canvas.width * scale;
        thumbCanvas.height = canvas.height * scale;
        const tCtx = thumbCanvas.getContext("2d");
        tCtx?.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

        const thumbBlob = await new Promise<Blob | null>((res) =>
          thumbCanvas.toBlob(res, "image/jpeg", 0.7)
        );
        if (thumbBlob) {
          await supabase.storage
            .from("event-photos")
            .upload(thumbPath, thumbBlob, { contentType: "image/jpeg" });
        }

        const { data: urlData } = supabase.storage
          .from("event-photos")
          .getPublicUrl(originalPath);
        const { data: thumbUrlData } = supabase.storage
          .from("event-photos")
          .getPublicUrl(thumbPath);

        const { error: dbErr } = await supabase.from("photos").insert({
          event_id: event.id,
          original_url: urlData.publicUrl,
          thumbnail_url: thumbUrlData.publicUrl,
        });
        if (dbErr) throw dbErr;

        setCapturedUrl(urlData.publicUrl);
        setPhase("result");
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Nepodařilo se nahrát fotku");
        setPhase("viewfinder");
      }
    }, "image/jpeg", 0.92);
  };

  const resetForNext = () => {
    setCapturedUrl(null);
    setPhase("viewfinder");
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Načítání…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Akce nenalezena.</p>
      </div>
    );
  }

  const galleryUrl = `${window.location.origin}/g/${event.slug}`;
  const primaryColor = style?.primary_color || undefined;

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {phase !== "result" && phase !== "gallery" && (
        <div className="relative flex-1 flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Countdown overlay */}
          <AnimatePresence>
            {phase === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"
              >
                <motion.span
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="font-display text-9xl font-bold drop-shadow-lg"
                  style={primaryColor ? { color: `hsl(${primaryColor})` } : undefined}
                >
                  {countdown}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Uploading overlay */}
          {phase === "uploading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <p className="text-foreground font-display text-2xl animate-pulse">Ukládám…</p>
            </div>
          )}

          {/* Event branding badge (logo + name) */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            {style?.logo_url && (
              <img
                src={style.logo_url}
                alt="Logo"
                className="h-8 w-auto rounded"
              />
            )}
            <span className="rounded-full bg-card/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-foreground">
              {event.name}
            </span>
          </div>

          {/* Toggle camera button */}
          <button
            onClick={toggleCamera}
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm text-foreground hover:bg-card transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Result screen */}
      {phase === "result" && capturedUrl && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={capturedUrl}
            alt="Pořízená fotka"
            className="max-h-[45vh] w-auto rounded-xl border border-border shadow-card object-contain"
          />

          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Naskenuj QR kód pro celou galerii</p>
            <div className="rounded-xl bg-foreground p-3">
              <QRCodeSVG
                value={galleryUrl}
                size={140}
                bgColor="hsl(45, 10%, 95%)"
                fgColor="hsl(220, 20%, 6%)"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gallery screen */}
      {phase === "gallery" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border">
            <button
              onClick={() => setPhase("result")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zpět na Další vzpomínku
            </button>
            <span className="ml-auto text-sm text-muted-foreground">
              {photos?.length ?? 0} fotek
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {photos?.filter(p => !p.hidden).map((photo) => (
                <img
                  key={photo.id}
                  src={photo.thumbnail_url}
                  alt={photo.caption || "Fotka"}
                  className="w-full aspect-square object-cover rounded-lg border border-border"
                />
              ))}
            </div>
            {(!photos || photos.filter(p => !p.hidden).length === 0) && (
              <p className="text-center text-muted-foreground py-12">Zatím žádné fotky.</p>
            )}
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="shrink-0 flex items-center justify-center gap-3 p-6 pb-8">
        {phase === "viewfinder" && (
          <button
            onClick={startCountdown}
            className="flex items-center gap-3 rounded-full gradient-accent px-8 py-4 text-lg font-display font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
            style={
              primaryColor
                ? {
                    background: `linear-gradient(135deg, hsl(${primaryColor}), hsl(${primaryColor} / 0.8))`,
                  }
                : undefined
            }
          >
            <Camera className="h-6 w-6" />
            Udělej si vzpomínku
          </button>
        )}

        {phase === "result" && (
          <>
            <button
              onClick={resetForNext}
              className="flex items-center gap-3 rounded-full gradient-accent px-6 py-4 text-base font-display font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
              style={
                primaryColor
                  ? {
                      background: `linear-gradient(135deg, hsl(${primaryColor}), hsl(${primaryColor} / 0.8))`,
                    }
                  : undefined
              }
            >
              <Camera className="h-5 w-5" />
              Další vzpomínka
            </button>
            <button
              onClick={() => setPhase("gallery")}
              className="flex items-center gap-3 rounded-full border border-border bg-card px-6 py-4 text-base font-display font-semibold text-foreground transition-transform hover:scale-105 active:scale-95"
            >
              <Images className="h-5 w-5" />
              Galerie akce
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraAction;
