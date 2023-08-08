import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { QueryClient, QueryClientProvider } from "react-query";
enableReactUse();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
