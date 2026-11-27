import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const RADIUS = 92;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HealthGauge({ score, max = 100, status, caption, className }) {
  const [swept, setSwept] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSwept(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const ratio = score == null ? 0 : Math.max(0, Math.min(1, score / max));
  const offset = CIRCUMFERENCE * (1 - (swept ? ratio : 0));

  return (
    <section className={cn("relative overflow-hidden rounded-3xl border border-border bg-card p-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Device health</h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">Live</span>
      </div>

      <div className="relative mx-auto mt-6 aspect-square w-full max-w-[264px]">
        <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
          <circle cx="120" cy="120" r={RADIUS} fill="none" strokeWidth="18" className="stroke-muted" />
          <circle
            cx="120"
            cy="120"
            r={RADIUS}
            fill="none"
            strokeWidth="18"
            strokeLinecap="round"
            transform="rotate(-90 120 120)"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
          />
          {[
            { x: 120, y: 58, label: "0" },
            { x: 182, y: 120, label: "25" },
            { x: 120, y: 182, label: "50" },
            { x: 58, y: 120, label: "75" },
          ].map((tick) => (
            <text
              key={tick.label}
              x={tick.x}
              y={tick.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {tick.label}
            </text>
          ))}
        </svg>

        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: "repeating-conic-gradient(from 0deg, rgba(240,253,250,0.22) 0deg 0.6deg, transparent 0.6deg 3.6deg)",
            mask: "radial-gradient(circle, transparent 0 66%, #000 66% 86%, transparent 86%)",
            WebkitMask: "radial-gradient(circle, transparent 0 66%, #000 66% 86%, transparent 86%)",
          }}
        />

        <div
          className="absolute inset-0 transition-transform duration-1000 ease-out motion-reduce:transition-none"
          style={{ transform: `rotate(${ratio * 360}deg)` }}
        >
          <div
            className="absolute aspect-square w-[10%] rounded-full bg-foreground shadow-sm"
            style={{ top: "11.7%", left: "50%", transform: "translate(-50%, -50%)" }}
          />
        </div>
      </div>

      <div className="mt-6 flex items-end gap-2">
        <span className="font-display text-6xl font-light leading-none tracking-tight text-foreground">
          {score == null ? "—" : score}
        </span>
        <span className="pb-1 text-sm text-muted-foreground">of {max}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{status}</p>
      {caption && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{caption}</p>}
    </section>
  );
}
