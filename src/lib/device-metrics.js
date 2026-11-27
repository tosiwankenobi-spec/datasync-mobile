// Real readings only. Every value here comes from a browser device API.
// When an API is missing we return null and the UI says so, instead of guessing.

const MB = 1024 * 1024;
const NETWORK_TYPES = ["slow-2g", "2g", "3g", "4g"];

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function formatMb(mb) {
  if (mb == null || Number.isNaN(mb)) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb >= 10240 ? 0 : 1)} GB`;
  return `${Math.round(mb)} MB`;
}

export function formatSeconds(sec) {
  if (sec == null || !Number.isFinite(sec) || sec <= 0 || sec > 60 * 60 * 12) return null;
  const hours = Math.floor(sec / 3600);
  const minutes = Math.round((sec % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function connection() {
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

/** Which real readings this browser is able to expose right now. */
export function readSupport() {
  const net = typeof navigator === "undefined" ? null : connection();
  const perfMemory = typeof performance !== "undefined" ? performance.memory : null;
  return {
    storage: typeof navigator !== "undefined" && typeof navigator.storage?.estimate === "function",
    battery: typeof navigator !== "undefined" && typeof navigator.getBattery === "function",
    deviceMemory: typeof navigator !== "undefined" && typeof navigator.deviceMemory === "number",
    heap: !!perfMemory,
    network: !!net,
    screen: typeof window !== "undefined" && !!window.screen,
  };
}

async function readStorage() {
  if (typeof navigator.storage?.estimate !== "function") return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    if (!quota) return null;
    return {
      usageMb: usage / MB,
      quotaMb: quota / MB,
      freeMb: Math.max(0, quota - usage) / MB,
      usedPct: clamp(Math.round((usage / quota) * 1000) / 10, 0, 100),
    };
  } catch {
    return null;
  }
}

async function readBattery() {
  if (typeof navigator.getBattery !== "function") return null;
  try {
    const battery = await navigator.getBattery();
    return {
      levelPct: typeof battery.level === "number" ? Math.round(battery.level * 100) : null,
      charging: !!battery.charging,
      chargingTimeSec: Number.isFinite(battery.chargingTime) ? battery.chargingTime : null,
      dischargingTimeSec: Number.isFinite(battery.dischargingTime) ? battery.dischargingTime : null,
    };
  } catch {
    return null;
  }
}

function readMemory() {
  const perfMemory = typeof performance !== "undefined" ? performance.memory : null;
  const deviceRamGb = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : null;
  const heap =
    perfMemory && perfMemory.jsHeapSizeLimit
      ? {
        usedMb: perfMemory.usedJSHeapSize / MB,
        limitMb: perfMemory.jsHeapSizeLimit / MB,
        usedPct: clamp(Math.round((perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 1000) / 10, 0, 100),
      }
      : null;
  if (deviceRamGb == null && !heap) return null;
  return { deviceRamGb, heap };
}

function readNetwork() {
  const net = connection();
  if (!net) return { online: typeof navigator !== "undefined" ? navigator.onLine : null };
  const type = NETWORK_TYPES.includes(net.effectiveType) ? net.effectiveType : null;
  return {
    online: navigator.onLine,
    effectiveType: type,
    downlinkMbps: typeof net.downlink === "number" ? net.downlink : null,
    rttMs: typeof net.rtt === "number" ? net.rtt : null,
    saveData: !!net.saveData,
  };
}

function readDevice() {
  const nav = navigator;
  const screenInfo = typeof window !== "undefined" ? window.screen : null;
  return {
    cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    platform: nav.userAgentData?.platform || nav.platform || null,
    screenW: screenInfo?.width ?? null,
    screenH: screenInfo?.height ?? null,
    dpr: typeof window !== "undefined" ? window.devicePixelRatio : null,
    touchPoints: typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : null,
    language: nav.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    standalone: typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)")?.matches,
  };
}

/** One complete set of live readings. Null sections mean "not exposed here". */
export async function readSnapshot() {
  if (typeof navigator === "undefined") return null;
  const [storage, battery] = await Promise.all([readStorage(), readBattery()]);
  return {
    readAt: Date.now(),
    storage,
    battery,
    memory: readMemory(),
    network: readNetwork(),
    device: readDevice(),
  };
}

const STORAGE_WEIGHT = 0.4;
const BATTERY_WEIGHT = 0.25;
const MEMORY_WEIGHT = 0.2;
const NETWORK_WEIGHT = 0.15;

function networkScore(net) {
  if (!net) return null;
  if (net.online === false) return 5;
  const byType = { "4g": 95, "3g": 65, "2g": 40, "slow-2g": 25 };
  if (net.effectiveType && byType[net.effectiveType]) return byType[net.effectiveType];
  if (net.downlinkMbps != null) return clamp(Math.round(net.downlinkMbps * 12), 25, 98);
  return null;
}

/** Health is a weighted average of the readings that actually exist on this device. */
export function buildHealth(snapshot) {
  const parts = [];

  if (snapshot.storage) {
    const used = snapshot.storage.usedPct;
    parts.push({
      key: "storage",
      label: "Storage headroom",
      weight: STORAGE_WEIGHT,
      score: Math.round(clamp(100 - (used - 30) * 1.2, 30, 100)),
      detail: `${used}% used · ${formatMb(snapshot.storage.freeMb)} free`,
      available: true,
    });
  } else {
    parts.push({ key: "storage", label: "Storage headroom", weight: STORAGE_WEIGHT, score: null, detail: "Not exposed by this browser", available: false });
  }

  if (snapshot.battery && snapshot.battery.levelPct != null) {
    const { levelPct, charging } = snapshot.battery;
    parts.push({
      key: "battery",
      label: "Battery",
      weight: BATTERY_WEIGHT,
      score: Math.round(charging ? clamp(60 + levelPct * 0.4, 60, 100) : levelPct),
      detail: `${levelPct}%${charging ? " · charging" : ""}`,
      available: true,
    });
  } else {
    parts.push({ key: "battery", label: "Battery", weight: BATTERY_WEIGHT, score: null, detail: "Not exposed by this browser", available: false });
  }

  const memory = snapshot.memory;
  const memoryValue = memory?.deviceRamGb ?? (memory?.heap ? clamp(Math.round((memory.heap.usedPct - 40) * 1.4), 25, 100) : null);
  parts.push({
    key: "memory",
    label: "Memory",
    weight: MEMORY_WEIGHT,
    score: memoryValue == null ? null : Math.round(clamp(memory?.deviceRamGb ? clamp((memory.deviceRamGb / 8) * 100, 45, 100) : memoryValue, 25, 100)),
    detail: memory
      ? [memory.deviceRamGb ? `${memory.deviceRamGb} GB device memory` : null, memory.heap ? `${formatMb(memory.heap.usedMb)} of ${formatMb(memory.heap.limitMb)} page memory` : null]
        .filter(Boolean)
        .join(" · ") || "Not exposed by this browser"
      : "Not exposed by this browser",
    available: !!memory,
  });

  const netScore = networkScore(snapshot.network);
  parts.push({
    key: "network",
    label: "Connection",
    weight: NETWORK_WEIGHT,
    score: netScore,
    detail: snapshot.network?.effectiveType
      ? `${snapshot.network.effectiveType.toUpperCase()}${snapshot.network.rttMs != null ? ` · ${snapshot.network.rttMs} ms` : ""}`
      : snapshot.network?.online === false
        ? "Offline"
        : "Not exposed by this browser",
    available: netScore != null,
  });

  const active = parts.filter((p) => p.available && p.score != null);
  const totalWeight = active.reduce((sum, p) => sum + p.weight, 0);
  const score = totalWeight
    ? Math.round(active.reduce((sum, p) => sum + p.score * p.weight, 0) / totalWeight)
    : null;

  return { score, parts, sampleCount: active.length };
}

export function healthStatus(score) {
  if (score == null) return "Waiting for a reading";
  if (score >= 85) return "Looking healthy";
  if (score >= 65) return "Mostly healthy";
  if (score >= 45) return "Needs attention";
  return "Under pressure";
}
