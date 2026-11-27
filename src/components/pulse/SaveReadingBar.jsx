import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { saveReading } from "@/lib/readings";
import { toast } from "sonner";

export default function SaveReadingBar({ snapshot, health }) {
  const { user, navigateToLogin } = useAuth();
  const [state, setState] = useState("idle");

  const handleSave = async () => {
    if (!user) {
      navigateToLogin();
      return;
    }
    setState("saving");
    try {
      await saveReading(snapshot, health);
      setState("saved");
      toast.success("Reading saved to your history");
    } catch (error) {
      setState("idle");
      toast.error(error?.message || "Could not save this reading");
    }
  };

  return (
    <section className="mt-5 flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-base font-medium text-foreground">Keep this reading</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {user
            ? "Saved readings build the trend on your history page."
            : "Sign in to keep readings over time. Readings are only stored for your account."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {state === "saved" && (
          <Link to="/history" className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary">
            View history
          </Link>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!snapshot || state === "saving" || state === "saved"}
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "saved" ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          {state === "saved" ? "Saved" : user ? "Save reading" : "Sign in to save"}
        </button>
      </div>
    </section>
  );
}
