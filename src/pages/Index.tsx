import { Link } from "react-router-dom";
import { Camera, LogIn } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-accent shadow-glow">
          <Camera className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          PhotoBox
        </h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Zachyťte každý okamžik vaší akce. Fotky ihned dostupné všem hostům — stačí naskenovat QR kód.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl gradient-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            Přihlášení správce
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Jste host? Přistupte ke galerii přes odkaz nebo QR kód od pořadatele.
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
