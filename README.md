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

To enable capture on Cloudflare Pages, set `VITE_PORCUPINE_USAGE_ENABLED=true` at build time. Add `PORCUPINE_USAGE_WRITE_KEY` as a secret for the Pages Function. Use a Porcupine API key with `events:write` for the Lunii project. Keep the key out of `VITE_` variables and source control.

Capture counts app opens, device connection attempts and successes, successful pack installs, removals and moves, and metadata syncs. Each event contains its name and a random message ID. Visitors who opt in under **Statistiques Porcupine** also get a first-party, randomly generated browser ID. The Pages Function sends it as the Porcupine `actor_id`. The browser keeps the preference for 180 days. Refusing or withdrawing consent removes the browser ID from local storage and future events still contribute to totals without a browser ID.

Count distinct nonempty `distinct_id` values to count opted-in browsers. Events captured before opt-in stay without a browser ID. This tracks browsers, and clearing site data or using a different browser creates a separate count. The existing PostHog setup is independent of this setting.
