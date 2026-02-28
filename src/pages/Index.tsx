import { Link } from "react-router-dom";
import { Camera, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { mockEvents } from "@/lib/mock-data";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden gradient-hero">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent shadow-glow">
              <Camera className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              PhotoBox
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              Zachyťte každý okamžik vaší akce. Fotky ihned dostupné všem hostům — stačí naskenovat QR kód.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl gradient-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
              >
                Správa akcí
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted"
              >
                Přihlášení
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Active events */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold mb-6">Aktuální akce</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link
                to={`/g/${event.slug}`}
                className="group block rounded-xl border border-border gradient-card p-5 transition-all hover:shadow-glow hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors">
                      {event.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{event.date}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-sm font-bold">{event.photoCount}</span>
                  </div>
                </div>
                {event.description && (
                  <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
