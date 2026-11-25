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

## Development and verification

Use the pinned pnpm version and a Node version matching `engines`:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm test:browser
pnpm test:production
pnpm lint
pnpm build
```

The browser tests require Playwright Chromium (`pnpm exec playwright install chromium`).
`test:production` builds the app and exercises a complete ZIP install through the
production bundle, including image conversion, the FFmpeg worker and audio
conversion. Audio tests download the pinned FFmpeg core from jsDelivr.

In development only, `/?demo=1` opens a sample library and `/?demo=empty` opens an
empty one. These fixtures use browser-private storage, never a connected device.
They are excluded from production builds.

### Device writes and recovery

All mutations use a Web Lock, so two tabs on the same origin cannot write at the
same time. The lock does not coordinate different browsers, profiles, origins or
other device-management programs. Do not use those concurrently on the same Lunii.

Install and delete operations create `.lunii-admin-operation.json` on the device
before touching pack content or its index. A failed operation leaves a recovery
action in the library. Recovery preserves indexed installs, removes unfinished
unindexed installs, or finishes a requested deletion. An unreadable journal can be
explicitly discarded; this removes only the journal, not pack files or the index.
Check the library afterwards because an interrupted operation may be incomplete.

Existing packs and untracked content directories are never overwritten by an
install. To replace a pack, keep its original ZIP, remove the installed pack, and
then install the replacement. If an old unindexed directory blocks an install,
back it up and move it off the device first. Each install uses a separate browser
staging directory; stale staging is removed under the write lock on the next install.

Browser tests use real OPFS handles and injected filesystem failures. They do not
prove USB/FAT durability or playback. Before releasing, verify install, reorder,
metadata edits and deletion on V2 and V3 devices, including recovery after unplug
and full-storage failures. Keep a device backup for these checks. Eject the device
through the operating system before unplugging it; a completed browser write is
not a guarantee that the OS has flushed the USB device.

### Dependency compatibility

React and Mantine are upgraded together. React Query v3 is replaced by TanStack
Query v5. Tetris remains lazy-loaded. Its upstream package has an outdated React
peer range, so `pnpm.peerDependencyRules.allowedVersions` explicitly allows React
19 for that package only. Browser coverage checks rendering, keyboard controls,
pause and unmounting. Its keyboard shortcuts are scoped to the focused game area.

FFmpeg is loaded only when conversion is needed, using `@ffmpeg/ffmpeg` 0.12.15 and
an explicitly pinned `@ffmpeg/core` 0.12.10 CDN URL. A stalled download, failed
initialization or conversion failure does not block browsing the library, and the
next attempt creates a fresh worker after failure. Pack previews remain limited
to V2 decryption; V3 does not attempt to decode with the V2 key.
