import { Link } from "react-router-dom";
import { Plus, Calendar, Aperture, Copy, Trash2 } from "lucide-react";
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

const EventList = () => {
  const { data: events, isLoading } = useEvents();
  const { isAdmin, managedEventIds } = useAuth();
  const deleteEvent = useDeleteEvent();

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
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/events/${event.id}`}
                  className="group flex flex-1 items-center gap-4 rounded-xl border border-border gradient-card p-4 sm:p-5 transition-all hover:shadow-glow hover:border-primary/30"
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
                      {!event.active && <span className="ml-2 text-xs rounded-md bg-muted text-muted-foreground px-1.5 py-0.5">Neaktivní</span>}
                    </p>
                  </div>
                </Link>
                <div className="flex flex-col gap-1">
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
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                          title="Smazat akci"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Smazat akci „{event.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tato akce bude trvale smazána včetně všech fotek. Tuto operaci nelze vrátit zpět.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Zrušit</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                await deleteEvent.mutateAsync(event.id);
                                toast.success("Akce smazána");
                              } catch {
                                toast.error("Nepodařilo se smazat akci");
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Smazat
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
