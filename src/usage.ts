import posthog from "posthog-js";
import type { UsageEvent } from "./usage-events";
import { getUsagePreference } from "./usage-preference";

const browserKey: string | undefined = import.meta.env.VITE_PORCUPINE_BROWSER_KEY;
const persistenceName = "lunii_porcupine";
export const usageEnabled = !!browserKey;

const eventProperties = new Set([
  "distinct_id",
  "token",
  "$session_id",
  "$browser",
  "$browser_version",
  "$browser_language",
  "$device_type",
  "$os",
  "$os_version",
  "$lib",
  "$lib_version",
  "$process_person_profile",
]);

let initialized = false;
let browserIdInUse: string | undefined;
let openingCaptured = false;

export function stopUsage() {
  if (browserIdInUse) {
    browserIdInUse = undefined;
    posthog.opt_out_capturing();
  }
  try {
    const prefix = `ph_${persistenceName}`;
    localStorage.removeItem(prefix);
    for (const key of Object.keys(sessionStorage)) {
      if (key === prefix || key.startsWith(`${prefix}_`)) sessionStorage.removeItem(key);
    }
  } catch {
    // Analytics stay off if browser storage is blocked.
  }
}

export function clearLegacyUsageStorage() {
  const oldKey = "ph_phc_Iy9MoSuNRAOinmUwdfJYlrsOkLkybqJSnTMaIItXHlz_posthog";
  if (document.cookie.split(/;\s*/).some((cookie) => cookie.startsWith(`${oldKey}=`))) {
    document.cookie = `${oldKey}=; Max-Age=0; Path=/; Domain=${location.hostname}`;
    document.cookie = `${oldKey}=; Max-Age=0; Path=/`;
  }
  try {
    localStorage.removeItem(oldKey);
  } catch {
    // The retired SDK no longer reads its storage.
  }
}

export function captureUsage(event: UsageEvent) {
  if (!browserKey) return;
  const preference = getUsagePreference();
  if (preference?.kind !== "allowed") {
    stopUsage();
    return;
  }
  if (event === "lunii_app_opened" && openingCaptured) return;

  const browserId = preference.browserId;
  const bootstrap = { distinctID: browserId, isIdentifiedID: false };
  if (!initialized) {
    posthog.init(browserKey, {
      api_host: "https://api.getporcupine.eu",
      api_transport: "fetch",
      bootstrap,
      persistence: "localStorage",
      persistence_name: persistenceName,
      opt_out_persistence_by_default: true,
      opt_out_capturing_persistence_type: "localStorage",
      person_profiles: "never",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_performance: false,
      capture_heatmaps: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      advanced_disable_decide: true,
      save_referrer: false,
      save_campaign_params: false,
      request_batching: false,
      disable_compression: true,
      ip: false,
      before_send: (capture) => {
        const current = getUsagePreference();
        if (!capture || current?.kind !== "allowed" || current.browserId !== browserIdInUse) return null;
        return {
          ...capture,
          properties: Object.fromEntries(
            Object.entries(capture.properties ?? {}).filter(([key]) => eventProperties.has(key))
          ),
        };
      },
    });
    initialized = true;
  }

  if (browserIdInUse !== browserId) {
    if (posthog.get_distinct_id() !== browserId) posthog.reset({ bootstrap });
    browserIdInUse = browserId;
    posthog.opt_in_capturing({ captureEventName: false });
  }

  if (posthog.capture(event) && event === "lunii_app_opened") openingCaptured = true;
}
