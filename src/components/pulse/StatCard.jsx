import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, sub, className }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-medium text-foreground">{value || "—"}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}
