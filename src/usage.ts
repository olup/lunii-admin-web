import type { UsageEvent } from "./usage-events";

export function captureUsage(event: UsageEvent) {
  if (import.meta.env.VITE_PORCUPINE_USAGE_ENABLED !== "true") return;
  if (typeof crypto.randomUUID !== "function") return;

  void fetch("/api/usage", {
    method: "POST",
    headers: {
      "X-Lunii-Event": event,
      "X-Lunii-Message-Id": crypto.randomUUID(),
    },
    credentials: "omit",
    referrerPolicy: "origin",
    keepalive: true,
  }).catch(() => undefined);
}
