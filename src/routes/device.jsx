import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CircleOff } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useDevicePulse } from "@/hooks/useDevicePulse";
import { formatMb, readSupport } from "@/lib/device-metrics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/device")({
  head: () => ({
    meta: [
      { title: "Device · DevicePulse" },
      { name: "description", content: "Which device readings this browser exposes, and which it withholds." },
    ],
  }),
  component: DevicePage,
});

function DevicePage() {
  const { snapshot, loading } = useDevicePulse();
  const support = typeof navigator === "undefined" ? {} : readSupport();
  const device = snapshot?.device;

  const rows = [
    {
      key: "storage",
      label: "Storage estimate",
      api: "navigator.storage.estimate()",
      available: support.storage,
      value: snapshot?.storage
        ? `${formatMb(snapshot.storage.usageMb)} of ${formatMb(snapshot.storage.quotaMb)} (${snapshot.storage.usedPct}%)`
        : null,
      note: "This is the space the browser allows this site, not the phone's whole drive.",
    },
    {
      key: "battery",
      label: "Battery",
      api: "navigator.getBattery()",
      available: support.battery,
      value: snapshot?.battery?.levelPct != null ? `${snapshot.battery.levelPct}%${snapshot.battery.charging ? ", charging" : ""}` : null,
      note: "Chromium browsers only. iOS and Firefox keep the battery private.",
    },
    {
      key: "deviceMemory",
      label: "Device memory",
      api: "navigator.deviceMemory",
      available: support.deviceMemory,
      value: snapshot?.memory?.deviceRamGb ? `${snapshot.memory.deviceRamGb} GB` : null,
      note: "Reported in whole gigabytes, rounded down by the browser.",
    },
    {
      key: "heap",
      label: "Page memory in use",
      api: "performance.memory",
      available: support.heap,
      value: snapshot?.memory?.heap ? `${formatMb(snapshot.memory.heap.usedMb)} of ${formatMb(snapshot.memory.heap.limitMb)}` : null,
      note: "Memory this page has allocated, Chromium only.",
    },
    {
      key: "network",
      label: "Connection",
      api: "navigator.connection",
      available: support.network,
      value: snapshot?.network?.effectiveType ? snapshot.network.effectiveType.toUpperCase() : null,
      note: "An estimate of the connection class, not a speed test.",
    },
    {
      key: "cores",
      label: "CPU cores",
      api: "navigator.hardwareConcurrency",
      available: device?.cores != null,
      value: device?.cores ? `${device.cores} cores` : null,
      note: "Threads available to this browser tab.",
    },
    {
      key: "screen",
      label: "Screen",
      api: "window.screen / devicePixelRatio",
      available: support.screen,
      value: device?.screenW ? `${device.screenW} × ${device.screenH} at ${device.dpr}×` : null,
      note: "CSS pixels, with the physical pixel ratio beside it.",
    },
    {
      key: "touch",
      label: "Touch input",
      api: "navigator.maxTouchPoints",
      available: device != null,
      value: device?.touchPoints != null ? `${device.touchPoints} touch points` : null,
      note: "Zero means this device is being used with a mouse or trackpad.",
    },
  ];

  return (
    <AppShell activePath="/device">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Straight from the browser</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">What this device reports</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          One row per API. A green tick means the device answered just now with the value beside it; a grey mark means this
          browser keeps it private.
        </p>
      </header>

      <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.key} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {row.available ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <CircleOff className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  <span className={cn("text-sm font-medium", row.available ? "text-foreground" : "text-muted-foreground")}>
                    {row.label}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{row.api}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row.note}</p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className={cn("font-mono text-sm", row.value ? "text-foreground" : "text-muted-foreground")}>
                  {row.value || (loading ? "Reading…" : "Not available")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Session</h2>
        <dl className="mt-4 space-y-3 text-sm">
          {[
            { key: "Platform", value: device?.platform },
            { key: "Language", value: device?.language },
            { key: "Time zone", value: device?.timezone },
            { key: "Running as", value: device ? (device.standalone ? "Installed app" : "Browser tab") : null },
          ].map((item) => (
            <div key={item.key} className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              <dt className="text-muted-foreground">{item.key}</dt>
              <dd className="text-right font-mono text-xs text-foreground">{item.value || "Not reported"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </AppShell>
  );
}
