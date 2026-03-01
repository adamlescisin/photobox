import { Link } from "react-router-dom";
import { Plus, Calendar } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const EventList = () => {
  const { data: events, isLoading } = useEvents();
  const { isAdmin, managedEventIds } = useAuth();

  const visibleEvents = events?.filter(
    (e) => isAdmin || managedEventIds.includes(e.id)
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Akce</h1>
        {isAdmin && (
          <Link
            to="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-xl gradient-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nová akce
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Načítání…</div>
      ) : (
        <div className="space-y-3">
          {visibleEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">Žádné akce.</p>
          )}
          {visibleEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/admin/events/${event.id}`}
                className="group flex items-center gap-4 rounded-xl border border-border gradient-card p-4 sm:p-5 transition-all hover:shadow-glow hover:border-primary/30"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">
                    {event.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {event.date} · <span className="text-foreground/70">/{event.slug}</span>
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
