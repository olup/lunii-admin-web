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

To enable capture on Cloudflare Pages, set `VITE_PORCUPINE_BROWSER_KEY` at build time. Use the public ingestion key for the Lunii project. The browser SDK sends events directly to `https://api.getporcupine.eu`. A private API key belongs on the server.

After opt-in under **Statistiques Porcupine**, capture counts app opens, device connection attempts and successes, successful pack installs, removals and moves, and metadata syncs. The SDK uses local storage and the app's random browser ID. The preference lasts 180 days. Withdraw consent in the same menu to stop capture and clear the browser ID.

Count distinct nonempty `distinct_id` values for opted-in browsers. Group by `json_extract_string(context, '$.session_id')` for visits. Historical events keep the IDs they were captured with.
