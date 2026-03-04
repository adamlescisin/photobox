import { useParams, Link } from "react-router-dom";
import { useEvent, useEventStyle } from "@/hooks/useEvents";
import { useUpsertEventStyle, useUploadStyleAsset } from "@/hooks/useEventStyles";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const EventStyleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(id);
  const { data: style, isLoading: styleLoading } = useEventStyle(id);
  const upsertStyle = useUpsertEventStyle();
  const uploadAsset = useUploadStyleAsset();

  const [primaryColor, setPrimaryColor] = useState("38 92% 50%");
  const [secondaryColor, setSecondaryColor] = useState("220 15% 16%");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
  const [wmShowName, setWmShowName] = useState(false);
  const [wmShowDate, setWmShowDate] = useState(false);
  const [wmShowLogo, setWmShowLogo] = useState(false);
  const [wmShowFrame, setWmShowFrame] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (style) {
      setPrimaryColor(style.primary_color || "38 92% 50%");
      setSecondaryColor(style.secondary_color || "220 15% 16%");
      setLogoUrl(style.logo_url);
      setWatermarkUrl(style.watermark_url);
      setWmShowName(style.watermark_show_name ?? false);
      setWmShowDate(style.watermark_show_date ?? false);
      setWmShowLogo(style.watermark_show_logo ?? false);
      setWmShowFrame(style.watermark_show_frame ?? false);
      setRemoveBackground((style as any).remove_background ?? false);
      setBackgroundImageUrl(style.background_image_url);
    }
  }, [style]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await upsertStyle.mutateAsync({
        eventId: id,
        style: {
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
          watermark_url: watermarkUrl,
          watermark_show_name: wmShowName,
          watermark_show_date: wmShowDate,
          watermark_show_logo: wmShowLogo,
          watermark_show_frame: wmShowFrame,
          remove_background: removeBackground,
          background_image_url: backgroundImageUrl,
        },
      });
      toast.success("Styling uložen");
    } catch {
      toast.error("Nepodařilo se uložit styling");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    type: "logo" | "watermark" | "background"
  ) => {
    if (!id) return;
    try {
      const url = await uploadAsset.mutateAsync({ eventId: id, file, type });
      if (type === "logo") setLogoUrl(url);
      else if (type === "watermark") setWatermarkUrl(url);
      else setBackgroundImageUrl(url);
      toast.success(`${type === "logo" ? "Logo" : type === "watermark" ? "Watermark" : "Pozadí"} nahráno`);
    } catch {
      toast.error("Nahrávání selhalo");
    }
  };

  const hslToHex = (hslStr: string) => {
    const parts = hslStr.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return "#d97706";
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const hexToHsl = (hex: string) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  if (eventLoading || styleLoading) {
    return <div className="text-muted-foreground animate-pulse py-20 text-center">Načítání…</div>;
  }

  if (!event) {
    return <div className="text-center py-20 text-muted-foreground">Akce nenalezena.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/admin/events/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Styling</h1>
            <p className="text-sm text-muted-foreground">{event.name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Uložit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Colors */}
          <Card>
            <CardHeader><CardTitle className="text-base">Barvy</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-28 shrink-0">Primární</Label>
                <input
                  type="color"
                  value={hslToHex(primaryColor)}
                  onChange={(e) => setPrimaryColor(hexToHsl(e.target.value))}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="38 92% 50%"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-28 shrink-0">Sekundární</Label>
                <input
                  type="color"
                  value={hslToHex(secondaryColor)}
                  onChange={(e) => setSecondaryColor(hexToHsl(e.target.value))}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="220 15% 16%"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader><CardTitle className="text-base">Logo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {logoUrl && (
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="Logo" className="h-14 w-14 rounded-xl object-contain bg-muted p-1" />
                  <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>Odebrat</Button>
                </div>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "logo"); }} />
              <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploadAsset.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                {uploadAsset.isPending ? "Nahrávání…" : "Nahrát logo"}
              </Button>
            </CardContent>
          </Card>

          {/* Watermark */}
          <Card>
            <CardHeader><CardTitle className="text-base">Watermark pro fotky</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="wm-name">Název akce</Label>
                  <Switch id="wm-name" checked={wmShowName} onCheckedChange={setWmShowName} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="wm-date">Datum akce</Label>
                  <Switch id="wm-date" checked={wmShowDate} onCheckedChange={setWmShowDate} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="wm-logo">Logo</Label>
                  <Switch id="wm-logo" checked={wmShowLogo} onCheckedChange={setWmShowLogo} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="wm-frame">Rámeček</Label>
                  <Switch id="wm-frame" checked={wmShowFrame} onCheckedChange={setWmShowFrame} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Vlastní watermark obrázek (volitelné)</p>
                {watermarkUrl && (
                  <div className="flex items-center gap-3 mb-2">
                    <img src={watermarkUrl} alt="Watermark" className="h-10 rounded object-contain bg-muted p-1" />
                    <Button variant="ghost" size="sm" onClick={() => setWatermarkUrl(null)}>Odebrat</Button>
                  </div>
                )}
                <input ref={watermarkInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "watermark"); }} />
                <Button variant="outline" size="sm" onClick={() => watermarkInputRef.current?.click()} disabled={uploadAsset.isPending}>
                  <Upload className="mr-2 h-4 w-4" />
                  Nahrát watermark
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader><CardTitle className="text-base">Pozadí fotografií</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="remove-bg">Odstranit pozadí</Label>
                  <p className="text-xs text-muted-foreground">Ponechá pouze osoby v popředí</p>
                </div>
                <Switch id="remove-bg" checked={removeBackground} onCheckedChange={setRemoveBackground} />
              </div>
              {removeBackground && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Vlastní pozadí (nahradí odstraněné pozadí)</p>
                    {backgroundImageUrl && (
                      <div className="flex items-center gap-3 mb-2">
                        <img src={backgroundImageUrl} alt="Pozadí" className="h-14 rounded-lg object-cover bg-muted" />
                        <Button variant="ghost" size="sm" onClick={() => setBackgroundImageUrl(null)}>Odebrat</Button>
                      </div>
                    )}
                    <input ref={backgroundInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "background"); }} />
                    <Button variant="outline" size="sm" onClick={() => backgroundInputRef.current?.click()} disabled={uploadAsset.isPending}>
                      <Upload className="mr-2 h-4 w-4" />
                      Nahrát pozadí
                    </Button>
                    {!backgroundImageUrl && (
                      <p className="text-xs text-muted-foreground mt-1">Bez vlastního pozadí bude použita primární barva.</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Náhled galerie
          </h3>

          {/* Gallery header preview */}
          <Card className="overflow-hidden">
            <div
              className="px-4 py-6"
              style={{
                background: `linear-gradient(135deg, hsl(${primaryColor} / 0.15), hsl(220 20% 6%) 60%)`,
              }}
            >
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-contain" />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: `hsl(${primaryColor} / 0.15)` }}
                  >
                    <span className="text-lg" style={{ color: `hsl(${primaryColor})` }}>📸</span>
                  </div>
                )}
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{event.name}</h2>
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 h-0.5 w-full rounded" style={{ background: `hsl(${primaryColor})` }} />
            </div>
          </Card>

          {/* Photo watermark preview */}
          <Card className="overflow-hidden">
            <CardHeader><CardTitle className="text-sm">Náhled watermarku</CardTitle></CardHeader>
            <CardContent>
              <div
                className="relative aspect-[4/3] rounded-lg overflow-hidden"
                style={{ background: `hsl(${secondaryColor})` }}
              >
                {/* Placeholder photo */}
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  Ukázková fotka
                </div>

                {/* Frame overlay */}
                {wmShowFrame && (
                  <div
                    className="absolute inset-2 rounded-md border-2 pointer-events-none"
                    style={{ borderColor: `hsl(${primaryColor} / 0.6)` }}
                  />
                )}

                {/* Logo watermark */}
                {wmShowLogo && logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Watermark logo"
                    className="absolute top-3 right-3 h-8 w-8 object-contain opacity-60"
                  />
                )}

                {/* Text watermarks - bottom left */}
                <div className="absolute bottom-3 left-3 space-y-0.5">
                  {wmShowName && (
                    <p
                      className="text-xs font-semibold drop-shadow-lg"
                      style={{ color: `hsl(${primaryColor})` }}
                    >
                      {event.name}
                    </p>
                  )}
                  {wmShowDate && (
                    <p className="text-[10px] text-foreground/70 drop-shadow-lg">
                      {event.date}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventStyleEditor;
