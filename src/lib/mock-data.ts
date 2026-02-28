export interface Event {
  id: string;
  name: string;
  slug: string;
  date: string;
  description?: string;
  photoCount: number;
  style?: EventStyle;
}

export interface EventStyle {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  backgroundImage?: string;
}

export interface Photo {
  id: string;
  eventId: string;
  timestamp: string;
  thumbnailUrl: string;
  originalUrl: string;
  caption?: string;
  hidden?: boolean;
}

export const mockEvents: Event[] = [
  {
    id: "1",
    name: "Maturitní ples 2026",
    slug: "maturitni-ples-2026",
    date: "2026-02-14",
    description: "Slavnostní maturitní ples gymnázia",
    photoCount: 24,
    style: {
      primaryColor: "38 92% 50%",
      secondaryColor: "220 15% 16%",
    },
  },
  {
    id: "2",
    name: "Firemní večírek TechCorp",
    slug: "firemni-vecirek-techcorp",
    date: "2026-03-10",
    description: "Roční firemní setkání",
    photoCount: 18,
  },
  {
    id: "3",
    name: "Svatba – Novákovi",
    slug: "svatba-novakovi",
    date: "2026-06-21",
    description: "Svatební oslava",
    photoCount: 42,
    style: {
      primaryColor: "340 65% 55%",
      secondaryColor: "340 30% 20%",
    },
  },
];

const placeholderPhotos = [
  "https://images.unsplash.com/photo-1529543544282-8e8beee4afdd?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=400&h=300&fit=crop",
];

export const generateMockPhotos = (eventId: string, count: number): Photo[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${eventId}-${i + 1}`,
    eventId,
    timestamp: new Date(2026, 1, 14, 19, 30 + i).toISOString(),
    thumbnailUrl: placeholderPhotos[i % placeholderPhotos.length],
    originalUrl: placeholderPhotos[i % placeholderPhotos.length].replace("w=400&h=300", "w=1920&h=1280"),
    caption: i === 0 ? "Úvodní fotka" : undefined,
  }));
};
