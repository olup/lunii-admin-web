import type { UsageEvent } from "./usage-events";
import { getUsagePreference } from "./usage-preference";

export const usageEnabled = import.meta.env.VITE_PORCUPINE_USAGE_ENABLED === "true";

export function captureUsage(event: UsageEvent) {
  if (!usageEnabled) return;
  if (typeof crypto.randomUUID !== "function") return;

  const headers = new Headers({
    "X-Lunii-Event": event,
    "X-Lunii-Message-Id": crypto.randomUUID(),
  });
  const preference = getUsagePreference();
  if (preference?.kind === "allowed") {
    headers.set("X-Lunii-Browser-Id", preference.browserId);
  }

  void fetch("/api/usage", {
    method: "POST",
    headers,
    credentials: "omit",
    referrerPolicy: "origin",
    keepalive: true,
  }).catch(() => undefined);
}
