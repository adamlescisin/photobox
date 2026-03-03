import { useParams, Link } from "react-router-dom";
import { useEventBySlug } from "@/hooks/useEvents";
import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Camera, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Phase = "viewfinder" | "countdown" | "uploading" | "result";

const CameraAction = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("viewfinder");
  const [countdown, setCountdown] = useState(5);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    // Stop any existing stream
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
    setCountdown(5);
    let c = 5;
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        capturePhoto();
      }
    }, 1000);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !event) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    setPhase("uploading");

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
        // Upload original
        const { error: upErr } = await supabase.storage
          .from("event-photos")
          .upload(originalPath, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;

        // Create a smaller thumbnail via canvas
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

        // Insert DB record
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

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera viewfinder / countdown / uploading */}
      {phase !== "result" && (
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
                  className="font-display text-9xl font-bold text-primary drop-shadow-lg"
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

          {/* Event name badge */}
          <div className="absolute top-4 left-4 z-20">
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

      {/* Bottom action bar */}
      <div className="shrink-0 flex items-center justify-center p-6 pb-8">
        {phase === "viewfinder" && (
          <button
            onClick={startCountdown}
            className="flex items-center gap-3 rounded-full gradient-accent px-8 py-4 text-lg font-display font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
          >
            <Camera className="h-6 w-6" />
            Udělej si vzpomínku
          </button>
        )}

        {phase === "result" && (
          <button
            onClick={resetForNext}
            className="flex items-center gap-3 rounded-full gradient-accent px-8 py-4 text-lg font-display font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
          >
            <Camera className="h-6 w-6" />
            Další vzpomínka
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraAction;
