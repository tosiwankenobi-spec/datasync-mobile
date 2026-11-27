import { cn } from "@/lib/utils";

const TONES = {
  good: "bg-primary",
  warn: "bg-[hsl(var(--warning))]",
  bad: "bg-destructive",
  neutral: "bg-muted-foreground/40",
};

function toneFor(row) {
  if (row.tone) return TONES[row.tone];
  if (row.pct == null) return TONES.neutral;
  if (row.pct >= 85) return TONES.bad;
  if (row.pct >= 65) return TONES.warn;
  return TONES.good;
}

export default function MetricPanel({ rows, className }) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card p-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live readings</h2>
        <span className="text-[11px] text-muted-foreground">This device</span>
      </div>

      <ul className="mt-5 divide-y divide-border">
        {rows.map((row) => (
          <li key={row.key} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={cn("font-display text-lg font-medium", row.value ? "text-foreground" : "text-muted-foreground")}>
                {row.value || "Not available"}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              {row.pct != null && (
                <div
                  className={cn("h-full rounded-full transition-all duration-700 motion-reduce:transition-none", toneFor(row))}
                  style={{ width: `${Math.min(100, Math.max(2, row.pct))}%` }}
                />
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{row.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
