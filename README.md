<p align="center">
  <img width="300" alt="image" src="https://user-images.githubusercontent.com/13785588/179449532-a4beb00f-0315-4386-9468-e494fc347224.png">
</p>

# Lunii admin web

[Hosted version here](https://lunii-admin-web.pages.dev)

A browser based tool to manage Lunii devices.

- Visualize the packs on your device
- Change their apparition order
- Delete packs
- **Add new packs** with the STUdio format (you can use lunii-admin-builder to create them)

## Porcupine usage events

To enable usage events on Cloudflare Pages, set `VITE_PORCUPINE_BROWSER_KEY` to the Lunii project's public ingestion key at build time. The app sends events to `https://api.getporcupine.eu/ingest/v1/events`.

Events count app opens, device connection attempts and successes, pack installs, removals and moves, and metadata syncs. When browser storage is available, `posthog-js` supplies a random browser ID and a session ID. Capture starts on app load. Requests omit cookies, IP fields, and the referring URL, and disable Porcupine's GeoIP lookup. Clearing browser storage resets the browser ID. Browsers that block storage still send aggregate events without IDs.

In Porcupine, filter to `starts_with(event, 'lunii_')` before counting distinct nonempty `distinct_id` values for browsers or grouping by `json_extract_string(context, '$.session_id')` for visits. This keeps the pseudonymous IDs from error reports out of usage counts. Historical usage events captured without IDs only contribute to event totals.

Pack install events record whether the ZIP has a title, its size rounded up in MiB, and the installation time in milliseconds. Device events can include the Lunii generation, and pack moves include the direction.

## Porcupine browser errors

The existing `VITE_PORCUPINE_BROWSER_KEY` also enables browser error capture. PostHog JS captures uncaught errors and unhandled promise rejections. Lunii sends error types, stack positions in the app's JavaScript assets, and the build's short Git SHA. It drops free-form messages and local file paths before sending. Error capture works even when browser storage is blocked.

For readable stacks, upload source maps with the same short Git SHA and the URL corresponding to your build output. Keep the maps private. [Porcupine error tracking guide](https://github.com/olup/porcupine/blob/v0.23.0/docs/error-tracking.md)
