import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, TrendingDown } from "lucide-react";
import AppShell from "@/components/AppShell";
import MetricTrendChart from "@/components/history/MetricTrendChart";
import { base44 } from "@/api/base44Client";
import { formatMb } from "@/lib/device-metrics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/history")({
  head: () => ({ meta: [{ title: "History · DevicePulse" }] }),
  component: HistoryPage,
});

function formatWhen(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function HistoryPage() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.entities.DeviceReading.list({ sort: "-read_at", limit: 60 })
      .then((page) => {
        if (alive) setReadings(page?.items ?? page ?? []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const recent = [...readings].reverse().slice(-12);
  const spansDays =
    recent.length > 1 && new Date(recent[recent.length - 1].read_at) - new Date(recent[0].read_at) > 24 * 60 * 60 * 1000;
  const shortLabel = (value) => {
    const date = new Date(value);
    return spansDays
      ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };
  const series = (key) => recent.map((reading) => ({ label: shortLabel(reading.read_at), value: reading[key] ?? null }));
  const average = readings.length
    ? Math.round(readings.reduce((sum, r) => sum + (r.health_score || 0), 0) / readings.length)
    : null;

  return (
    <AppShell activePath="/history">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Saved readings</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">History</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Each row is a real reading you saved from a device. The trend is drawn from those saved numbers only.
        </p>
      </header>

      {loading ? (
        <div className="mt-16 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : readings.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
          <TrendingDown className="mx-auto h-6 w-6 text-muted-foreground" />
          <h2 className="mt-3 font-display text-lg font-medium text-foreground">No readings saved yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Open Pulse on the device you want to check and press Save reading. Two or more readings start drawing the
            trend.
          </p>
          <a href="/" className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Go to Pulse
          </a>
        </div>
      ) : (
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Readings", value: String(readings.length) },
            { label: "Average score", value: average == null ? "—" : `${average} of 100` },
            { label: "Latest score", value: readings[0]?.health_score != null ? `${readings[0].health_score} of 100` : "—" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
              <p className="mt-2 font-display text-2xl font-medium text-foreground">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Device statistics over time</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            One card per reading your device reported. Point at a step to read its exact value.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <MetricTrendChart
              title="Health score"
              unit="/100"
              points={series("health_score")}
              domain={[0, 100]}
              emptyHint="No health scores saved yet."
            />
            <MetricTrendChart
              title="Battery"
              unit="%"
              points={series("battery_pct")}
              emptyHint="No battery readings saved yet. Chrome on Android reports it; desktop and iOS browsers keep it private."
            />
            <MetricTrendChart
              title="Storage used"
              unit="%"
              points={series("storage_used_pct")}
              emptyHint="No storage readings saved yet."
            />
            <MetricTrendChart
              title="Page memory"
              unit=" MB"
              points={series("memory_used_mb")}
              emptyHint="No memory readings saved yet. Chromium browsers report the memory this page uses."
            />
            <MetricTrendChart
              title="Download speed"
              unit=" Mb/s"
              points={series("downlink_mbps")}
              emptyHint="No connection speed readings saved yet."
            />
            <MetricTrendChart
              title="Round trip"
              unit=" ms"
              points={series("rtt_ms")}
              emptyHint="No round-trip readings saved yet."
            />
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">Score</th>
                <th className="px-5 py-3 font-semibold">Storage</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Battery</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Connection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {readings.map((reading) => (
                <tr key={reading.id}>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">{formatWhen(reading.read_at)}</td>
                  <td className={cn("px-5 py-3 font-display text-base", reading.health_score >= 85 ? "text-primary" : reading.health_score >= 60 ? "text-foreground" : "text-[hsl(var(--warning))]")}>
                    {reading.health_score}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {reading.storage_used_pct}% · {formatMb(reading.storage_used_mb)} of {formatMb(reading.storage_quota_mb)}
                  </td>
                  <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">
                    {reading.battery_pct == null ? "Not reported" : `${reading.battery_pct}%${reading.charging ? " · charging" : ""}`}
                  </td>
                  <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                    {reading.connection_type ? reading.connection_type.toUpperCase() : "Not reported"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </AppShell>
  );
}
