import { Link } from "react-router-dom";
import { Calendar, Plus, Aperture, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const { data: events, isLoading } = useEvents();
  const { isAdmin, managedEventIds } = useAuth();

  const visibleEvents = events?.filter(
    (e) => isAdmin || managedEventIds.includes(e.id)
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border gradient-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{visibleEvents.length}</p>
              <p className="text-sm text-muted-foreground">Akce</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Načítání akcí…</div>
      ) : (
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Poslední akce</h2>
          <div className="space-y-2">
            {visibleEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">Žádné akce k zobrazení.</p>
            )}
            {visibleEvents.slice(0, 5).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/events/${event.id}`}
                  className="flex flex-1 items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
                >
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <span className="text-xs rounded-md bg-primary/10 text-primary px-2 py-1 font-medium">
                    Otevřít
                  </span>
                </Link>
                <div className="flex gap-1">
                  <a
                    href={`/g/${event.slug}/action`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    title="Otevřít Action!"
                  >
                    <Aperture className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/g/${event.slug}`);
                      toast.success("URL galerie zkopírována");
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    title="Kopírovat URL galerie"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
