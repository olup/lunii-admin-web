import React from "react";
import ReactDOM from "react-dom/client";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { createTheme, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Notifications } from "@mantine/notifications";
import App from "./App";
import BetaBadge from "./components/BetaTag";
import { captureUsage } from "./usage";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles.css";

enableReactUse();
captureUsage("lunii_app_opened");
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, networkMode: "always" },
    mutations: { networkMode: "always" },
  },
});
const theme = createTheme({
  primaryColor: "blue",
  primaryShade: 8,
  defaultRadius: "md",
});
function previousColorScheme(): "light" | "dark" | "auto" {
  try {
    const saved = JSON.parse(localStorage.getItem("colorScheme") || '"auto"');
    return saved === "light" || saved === "dark" ? saved : "auto";
  } catch {
    return "auto";
  }
}
async function render() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has("demo")) {
    const { loadDemo } = await import("./dev/fixture");
    await loadDemo();
  }
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <MantineProvider
          theme={theme}
          cssVariablesResolver={() => ({
            variables: {},
            light: { "--mantine-color-dimmed": "#62676f" },
            dark: { "--mantine-color-dimmed": "#b0b4bc" },
          })}
          defaultColorScheme={previousColorScheme()}
        >
          <ModalsProvider
            modalProps={{
              closeButtonProps: { "aria-label": "Fermer la confirmation" },
            }}
          >
            <Notifications position="bottom-right" />
            <BetaBadge />
            <App />
          </ModalsProvider>
        </MantineProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
void render();
