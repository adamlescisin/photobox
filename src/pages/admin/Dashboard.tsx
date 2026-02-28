import { Link } from "react-router-dom";
import { Calendar, Camera, Image, Plus } from "lucide-react";
import { mockEvents } from "@/lib/mock-data";
import { motion } from "framer-motion";

const stats = [
  { label: "Akce", value: mockEvents.length, icon: Calendar },
  { label: "Celkem fotek", value: mockEvents.reduce((s, e) => s + e.photoCount, 0), icon: Image },
  { label: "Kamera", value: "Online", icon: Camera },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <Link
          to="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-xl gradient-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nová akce
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border gradient-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Poslední akce</h2>
        <div className="space-y-2">
          {mockEvents.map((event) => (
            <Link
              key={event.id}
              to={`/admin/events/${event.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
            >
              <div>
                <p className="font-medium">{event.name}</p>
                <p className="text-sm text-muted-foreground">{event.date} · {event.photoCount} fotek</p>
              </div>
              <span className="text-xs rounded-md bg-primary/10 text-primary px-2 py-1 font-medium">
                Otevřít
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
