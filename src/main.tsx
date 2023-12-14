import React, { FC, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "react-query";
import { Notifications } from "@mantine/notifications";
import { state } from "./store.ts";
import BetaBadge from "./components/BetaTag.tsx";
enableReactUse();

const queryClient = new QueryClient();

const WithMantine: FC<{ children: ReactNode }> = ({ children }) => {
  const colorScheme = state.colorScheme.use();
  return (
    <MantineProvider theme={{ colorScheme }} withCSSVariables withGlobalStyles>
      <ModalsProvider>
        <Notifications />
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WithMantine>
        <BetaBadge />
        <App />
      </WithMantine>
    </QueryClientProvider>
  </React.StrictMode>
);
