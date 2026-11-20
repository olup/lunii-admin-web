import type { modelVersion } from "./utils/lunii/deviceInfo";

type DeviceProperties = { device_generation?: modelVersion };

export type UsageEvent =
  | [event: "lunii_app_opened" | "lunii_device_connect_started"]
  | [
      event: "lunii_device_connected" | "lunii_pack_removed" | "lunii_metadata_synced",
      properties: DeviceProperties,
    ]
  | [
      event: "lunii_pack_installed",
      properties: DeviceProperties & {
        has_pack_title: boolean;
        archive_size_mib: number;
        install_duration_ms: number;
      },
    ]
  | [
      event: "lunii_pack_reordered",
      properties: DeviceProperties & { move_direction: "up" | "down" },
    ];
