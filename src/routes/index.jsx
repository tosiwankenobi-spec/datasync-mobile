import { createFileRoute } from "@tanstack/react-router";
import { Clock, Cpu, Monitor, Signal, Smartphone, Touchpad } from "lucide-react";
import AppShell from "@/components/AppShell";
import HealthGauge from "@/components/pulse/HealthGauge";
import MetricPanel from "@/components/pulse/MetricPanel";
import SaveReadingBar from "@/components/pulse/SaveReadingBar";
import StatCard from "@/components/pulse/StatCard";
import { useDevicePulse } from "@/hooks/useDevicePulse";
import { formatMb, formatSeconds, healthStatus } from "@/lib/device-metrics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevicePulse · Live device health" },
      { name: "description", content: "Storage, battery, memory and connection read live from the device you are using. No estimated numbers." },
    ],
  }),
  component: PulsePage,
});

function buildRows(snapshot, loading) {
  const pending = loading ? "Reading…" : null;

  const storage = snapshot?.storage;
  const battery = snapshot?.battery;
  const memory = snapshot?.memory;
  const network = snapshot?.network;

  return [
    {
      key: "storage",
      label: "Storage",
      value: storage ? `${formatMb(storage.usageMb)} of ${formatMb(storage.quotaMb)}` : pending,
      pct: storage?.usedPct ?? null,
      detail: storage
        ? `${storage.usedPct}% of the storage this browser allows the site · ${formatMb(storage.freeMb)} still free`
        : "This browser does not expose a storage estimate.",
    },
    {
      key: "battery",
      label: "Battery",
      value: battery?.levelPct != null ? `${battery.levelPct}%` : pending,
      pct: battery?.levelPct ?? null,
      tone: battery?.charging
        ? "good"
        : battery?.levelPct == null
          ? "neutral"
          : battery.levelPct < 20
            ? "bad"
            : battery.levelPct < 40
              ? "warn"
              : "good",
      detail: battery
        ? battery.charging
          ? `Charging${formatSeconds(battery.chargingTimeSec) ? ` · full in about ${formatSeconds(battery.chargingTimeSec)}` : ""}`
          : `On battery${formatSeconds(battery.dischargingTimeSec) ? ` · about ${formatSeconds(battery.dischargingTimeSec)} left` : ""}`
        : "This browser does not expose its battery, which is normal on desktop and on iOS.",
    },
    {
      key: "memory",
      label: "Memory",
      value: memory?.deviceRamGb
        ? `${memory.deviceRamGb} GB`
        : memory?.heap
          ? `${formatMb(memory.heap.usedMb)} in use`
          : pending,
      pct: memory?.heap?.usedPct ?? null,
      detail: memory?.heap
        ? `This page is using ${formatMb(memory.heap.usedMb)} of ${formatMb(memory.heap.limitMb)} it may allocate`
        : memory?.deviceRamGb
          ? "Device memory reported by the browser"
          : "This browser does not report memory, which is normal on iOS and Firefox.",
    },
    {
      key: "network",
      label: "Connection",
      value: network?.effectiveType ? network.effectiveType.toUpperCase() : network?.online === false ? "Offline" : pending,
      pct: null,
      detail: network?.effectiveType
        ? [
            network.downlinkMbps != null ? `about ${network.downlinkMbps} Mb/s down` : null,
            network.rttMs != null ? `${network.rttMs} ms round trip` : null,
            network.saveData ? "data saver on" : null,
          ]
          .filter(Boolean)
          .join(" · ")
        : "This browser does not describe its connection, which is normal on iOS.",
    },
  ];
}

function PulsePage() {
  const { snapshot, health, loading } = useDevicePulse();
  const device = snapshot?.device;
  const rows = buildRows(snapshot, loading);
  const score = health?.score ?? null;

  return (
    <AppShell activePath="/">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Read live from this device</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Your device, right now
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Every number below comes from an API this browser exposes. When the device does not report something we say so
          instead of filling in a figure.
        </p>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        <HealthGauge
          score={score}
          status={healthStatus(score)}
          caption={
            health?.sampleCount
              ? `Built from ${health.sampleCount} of 4 live readings, refreshed every 5 seconds.`
              : "Waiting for the first reading from this device."
          }
        />
        <MetricPanel rows={rows} />
      </div>

      <SaveReadingBar snapshot={snapshot} health={health} />

      <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Cpu}
          label="Processor"
          value={device?.cores ? `${device.cores} cores` : loading ? "Reading…" : null}
          sub="Threads the browser will run"
        />
        <StatCard
          icon={Monitor}
          label="Screen"
          value={device?.screenW ? `${device.screenW} × ${device.screenH}` : loading ? "Reading…" : null}
          sub={device?.dpr ? `${device.dpr}× pixel density` : null}
        />
        <StatCard
          icon={Touchpad}
          label="Input"
          value={device ? (device.touchPoints > 0 ? "Touch screen" : "Mouse or trackpad") : loading ? "Reading…" : null}
          sub={device ? `${device.touchPoints} touch points reported` : null}
        />
        <StatCard
          icon={Clock}
          label="Time zone"
          value={device?.timezone}
          sub={device?.language ? `Browser language ${device.language}` : null}
        />
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">This device</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              { key: "Platform", value: device?.platform },
              { key: "Installed as app", value: device ? (device.standalone ? "Yes, running standalone" : "No, running in the browser") : null },
              { key: "Screen density", value: device?.dpr ? `${device.dpr}×` : null },
              { key: "Last reading", value: snapshot ? new Date(snapshot.readAt).toLocaleTimeString("en-US", { hour12: false }) : null },
            ].map((item) => (
              <div key={item.key} className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{item.key}</dt>
                <dd className="text-right font-mono text-xs text-foreground">{item.value || "Not reported"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Signal className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">What a browser cannot see</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">Whole-phone storage.</span> The storage figure covers what this site may
              use, not the drive inside your phone.
            </li>
            <li>
              <span className="text-foreground">Other apps.</span> Caches and data belonging to other apps are private to
              them, and a website cannot read or clear them.
            </li>
            <li>
              <span className="text-foreground">Your photo library.</span> Photos are only reachable when you pick them
              yourself.
            </li>
          </ul>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Smartphone className="h-3.5 w-3.5" />
            Open DevicePulse on the phone that needs checking to see its own readings.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
