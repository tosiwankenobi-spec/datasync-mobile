import { base44 } from "@/api/base44Client";

/** Persists the exact readings the device just reported. Nothing is filled in. */
export async function saveReading(snapshot, health) {
  if (!snapshot) return null;
  const { storage, battery, memory, network, device } = snapshot;
  return base44.entities.DeviceReading.create({
    read_at: new Date(snapshot.readAt).toISOString(),
    health_score: health?.score ?? 0,
    storage_used_pct: storage?.usedPct ?? 0,
    storage_used_mb: Math.round(storage?.usageMb ?? 0),
    storage_quota_mb: Math.round(storage?.quotaMb ?? 0),
    battery_pct: battery?.levelPct ?? null,
    charging: battery?.charging ?? null,
    memory_used_mb: memory?.heap ? Math.round(memory.heap.usedMb) : null,
    memory_limit_mb: memory?.heap ? Math.round(memory.heap.limitMb) : null,
    device_memory_gb: memory?.deviceRamGb ?? null,
    cpu_cores: device?.cores ?? null,
    connection_type: network?.effectiveType ?? null,
    downlink_mbps: network?.downlinkMbps ?? null,
    rtt_ms: network?.rttMs ?? null,
    screen: device?.screenW ? `${device.screenW}x${device.screenH}` : null,
    platform: device?.platform ?? null,
  });
}
