import { useCallback, useEffect, useState } from "react";
import { buildHealth, readSnapshot } from "@/lib/device-metrics";

const POLL_MS = 5000;

/** Live readings from this device, refreshed on a timer and on real device events. */
export function useDevicePulse() {
  const [snapshot, setSnapshot] = useState(null);
  const [health, setHealth] = useState(null);

  const refresh = useCallback(async () => {
    const next = await readSnapshot();
    if (!next) return next;
    setSnapshot(next);
    setHealth(buildHealth(next));
    return next;
  }, []);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const next = await readSnapshot();
      if (!alive || !next) return;
      setSnapshot(next);
      setHealth(buildHealth(next));
    };
    run();

    const onEvent = () => run();
    const timer = setInterval(run, POLL_MS);
    window.addEventListener("online", onEvent);
    window.addEventListener("offline", onEvent);
    document.addEventListener("visibilitychange", onEvent);
    navigator.getBattery?.().then((battery) => {
      if (!alive) return;
      battery.addEventListener?.("levelchange", onEvent);
      battery.addEventListener?.("chargingchange", onEvent);
    }).catch(() => {});

    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("online", onEvent);
      window.removeEventListener("offline", onEvent);
      document.removeEventListener("visibilitychange", onEvent);
    };
  }, []);

  return { snapshot, health, refresh, loading: !snapshot };
}
