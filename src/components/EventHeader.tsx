import { Event } from "@/lib/mock-data";
import { Camera } from "lucide-react";

interface EventHeaderProps {
  event: Event;
  showBranding?: boolean;
}

const EventHeader = ({ event, showBranding = true }: EventHeaderProps) => {
  const primaryColor = event.style?.primaryColor || "38 92% 50%";

  return (
    <header className="relative overflow-hidden border-b border-border">
      <div className="gradient-hero px-4 py-6 sm:py-8">
        <div className="container mx-auto flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: `hsl(${primaryColor} / 0.15)` }}
          >
            <Camera className="h-6 w-6" style={{ color: `hsl(${primaryColor})` }} />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              {event.name}
            </h1>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
            )}
          </div>
        </div>
      </div>
      {showBranding && (
        <div
          className="absolute bottom-0 left-0 h-0.5 w-full"
          style={{ background: `hsl(${primaryColor})` }}
        />
      )}
    </header>
  );
};

export default EventHeader;
