import posthog from "posthog-js/no-external";
import type { CaptureResult } from "posthog-js/no-external";
import "posthog-js/dist/exception-autocapture.js";
import { publicExceptions } from "./error-reporting";
import type { UsageEvent } from "./usage-events";

const browserKey: string | undefined = import.meta.env.VITE_PORCUPINE_BROWSER_KEY;
const ingestionOrigin = "https://api.getporcupine.eu";
const usagePropertyNames = new Set([
  "device_generation",
  "has_pack_title",
  "archive_size_mib",
  "install_duration_ms",
  "move_direction",
]);

function send(path: string, headers: Record<string, string>, body: Record<string, unknown>) {
  void fetch(`${ingestionOrigin}${path}`, {
    method: "POST",
    headers,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    body: JSON.stringify(body),
  }).catch(() => {
    // A metrics failure must not interrupt the app.
  });
}

function sendUsage(name: string, properties?: Record<string, unknown>, actorId?: string, sessionId?: string) {
  if (!browserKey) return;

  send("/ingest/v1/events", { "Content-Type": "application/json", "X-Porcupine-Key": browserKey }, {
    type: "track",
    name,
    actor_id: actorId,
    properties,
    context: { geoip_disable: true, session_id: sessionId },
  });
}

function sendException({ uuid, timestamp, properties }: CaptureResult) {
  if (!browserKey) return;
  const exceptions = publicExceptions(properties.$exception_list, window.location.origin);
  if (exceptions.length === 0) return;

  send("/batch/", { "Content-Type": "text/plain" }, {
    api_key: browserKey,
    sent_at: new Date().toISOString(),
    batch: [{
      event: "$exception",
      distinct_id: "$posthog_cookieless",
      timestamp,
      uuid,
      properties: {
        $exception_list: exceptions,
        $exception_build_id: __COMMIT_HASH__.trim(),
        $geoip_disable: true,
      },
    }],
  });
}

function hasBrowserStorage() {
  // The SDK can fall back to cookies when web storage is unavailable.
  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      storage.setItem("lunii_usage_storage_probe", "1");
      storage.removeItem("lunii_usage_storage_probe");
    }
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = Boolean(browserKey && hasBrowserStorage());
const analytics = browserKey ? posthog.init(browserKey, {
  api_host: ingestionOrigin,
  persistence: storageAvailable ? "localStorage" : "memory",
  persistence_name: "lunii_usage",
  opt_out_capturing_persistence_type: "localStorage",
  cross_subdomain_cookie: false,
  person_profiles: "never",
  autocapture: false,
  capture_exceptions: true,
  capture_pageview: false,
  capture_pageleave: false,
  capture_dead_clicks: false,
  capture_performance: false,
  capture_heatmaps: false,
  disable_session_recording: true,
  disable_surveys: true,
  advanced_disable_flags: true,
  save_referrer: false,
  save_campaign_params: false,
  ip: false,
  before_send: (event) => {
    if (event?.event === "$exception") {
      sendException(event);
      return null;
    }
    if (!event?.event.startsWith("lunii_")) return null;

    const { distinct_id, $session_id } = event.properties;
    const properties = Object.fromEntries(
      Object.entries(event.properties).filter(([name]) => usagePropertyNames.has(name)),
    );

    // Use the native transport so every request omits credentials and referrers.
    sendUsage(
      event.event,
      Object.keys(properties).length ? properties : undefined,
      typeof distinct_id === "string" ? distinct_id : undefined,
      typeof $session_id === "string" ? $session_id : undefined,
    );
    return null;
  },
}) : undefined;

export function captureUsage(...[name, properties]: UsageEvent) {
  if (storageAvailable && analytics) {
    analytics.capture(name, properties);
  } else {
    sendUsage(name, properties);
  }
}
