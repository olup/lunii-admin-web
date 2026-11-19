export const usageEvents = [
  "lunii_app_opened",
  "lunii_device_connect_started",
  "lunii_device_connected",
  "lunii_pack_installed",
  "lunii_pack_removed",
  "lunii_pack_reordered",
  "lunii_metadata_synced",
] as const;

export type UsageEvent = (typeof usageEvents)[number];
