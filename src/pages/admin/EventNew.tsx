import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const EventNew = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlug(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Akce vytvořena!");
    navigate("/admin/events");
  };

  const inputClasses =
    "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Nová akce</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Název akce</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={inputClasses}
            placeholder="Maturitní ples 2026"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Slug (URL)</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/g/</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClasses}
              placeholder="maturitni-ples-2026"
              required
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Popis (volitelné)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClasses} resize-none`}
            rows={3}
            placeholder="Krátký popis akce…"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl gradient-accent py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-95"
        >
          Vytvořit akci
        </button>
      </form>
    </div>
  );
};

export default EventNew;
