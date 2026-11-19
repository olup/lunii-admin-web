import { randomIDPattern } from "./usage-events";

const preferenceKey = "lunii-porcupine-preference";
const preferenceDurationMs = 180 * 24 * 60 * 60 * 1000;

export type UsageChoice = "allowed" | "declined";

type UsagePreference =
  | { kind: "allowed"; expiresAt: number; browserId: string }
  | { kind: "declined"; expiresAt: number };

let declinedForThisPage = false;

export function getUsagePreference(): UsagePreference | undefined {
  if (declinedForThisPage) return;
  try {
    const stored = localStorage.getItem(preferenceKey);
    if (!stored) return;
    const preference: unknown = JSON.parse(stored);
    if (
      !preference ||
      typeof preference !== "object" ||
      !("kind" in preference) ||
      !("expiresAt" in preference) ||
      typeof preference.expiresAt !== "number" ||
      !Number.isFinite(preference.expiresAt)
    ) return;

    const expiresAt = preference.expiresAt;
    if (expiresAt <= Date.now()) {
      localStorage.removeItem(preferenceKey);
      return;
    }
    if (preference.kind === "declined") return { kind: "declined", expiresAt };
    if (
      preference.kind === "allowed" &&
      "browserId" in preference &&
      typeof preference.browserId === "string" &&
      randomIDPattern.test(preference.browserId)
    ) return { kind: "allowed", expiresAt, browserId: preference.browserId };
  } catch {
    // Treat blocked or unreadable storage as missing consent.
  }
}

export function saveUsagePreference(choice: UsageChoice): boolean {
  const expiresAt = Date.now() + preferenceDurationMs;
  try {
    let preference: UsagePreference = { kind: "declined", expiresAt };
    if (choice === "allowed") {
      const current = getUsagePreference();
      const browserId = current?.kind === "allowed" ? current.browserId : crypto.randomUUID();
      preference = { kind: "allowed", expiresAt, browserId };
    }
    localStorage.setItem(preferenceKey, JSON.stringify(preference));
    declinedForThisPage = false;
    return true;
  } catch {
    if (choice === "allowed") return false;
    declinedForThisPage = true;
    return true;
  }
}
