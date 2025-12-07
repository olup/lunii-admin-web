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

## Configuration

### PostHog Analytics (Optional)

This project supports PostHog analytics. To enable it, create a `.env` file in the project root with the following variables:

```
VITE_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
VITE_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

If these variables are not set, the application will work normally without analytics.