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

Events count app opens, device connection attempts and successes, pack installs, removals and moves, and metadata syncs. Each request omits browser, session, and device identifiers, omits cookies and the referring URL, and disables Porcupine's GeoIP lookup.

Pack install events record whether the ZIP has a title, its size rounded up in MiB, and the installation time in milliseconds. Device events can include the Lunii generation, and pack moves include the direction.
