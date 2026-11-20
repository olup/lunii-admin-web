import type { UsageEvent } from "./usage-events";

const browserKey: string | undefined = import.meta.env.VITE_PORCUPINE_BROWSER_KEY;

export function captureUsage(...[name, properties]: UsageEvent) {
  if (!browserKey) return;

  void fetch("https://api.getporcupine.eu/ingest/v1/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Porcupine-Key": browserKey },
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    body: JSON.stringify({ type: "track", name, properties, context: { geoip_disable: true } }),
  }).catch(() => {
    // A metrics failure must not interrupt the app.
  });
}
