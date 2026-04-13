import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";

import { store } from "./store";
import App from "./App";
import { cleanObj } from "utils/objects";

// Init css
import "react-toastify/dist/ReactToastify.css";
// Boostrap loaders
import "bootstrap/dist/css/bootstrap.min.css";
// Custom styles
import "./dappnode_styles.scss";
import "./dappnode_colors.scss";
import "./light_dark.scss";
import "./layout.scss";
// PWA
import { PwaInstallProvider } from "pages/system/components/App/PwaInstallContext";
// Grafana Faro for frontend monitoring and tracing
import { createRoutesFromChildren, matchRoutes, Routes, useLocation, useNavigationType } from "react-router-dom";
import {
  createReactRouterV6Options,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration
} from "@grafana/faro-react";
import { getDefaultOTELInstrumentations, TracingInstrumentation } from "@grafana/faro-web-tracing";

// Build metrics URL based on current browser location
const getMetricsBaseUrl = () => {
  const protocol = window.location.protocol; // e.g., "http:" or "https:"
  const host = window.location.host; // e.g., "localhost:3000" or "my.dappnode:8080"
  return `${protocol}//${host}:8080`;
};

const metricsBaseUrl = getMetricsBaseUrl();
// Create a regex pattern that escapes special characters for the ignoreUrls
const metricsUrlPattern = new RegExp(`^${metricsBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

initializeFaro({
  url: metricsBaseUrl,
  app: {
    name: "dappnode",
    version: "1.0.0",
    environment: "production"
  },
  sessionTracking: {
    samplingRate: 1,
    persistent: true
  },
  instrumentations: [
    // Mandatory, omits default instrumentations otherwise.
    ...getWebInstrumentations({}),

    // Tracing package to get end-to-end visibility for HTTP requests.
    new TracingInstrumentation({
      instrumentations: [...getDefaultOTELInstrumentations({ ignoreUrls: [metricsUrlPattern] })] // ignore ui-metrics endpoint to avoid having spam of requests in grafana-cloud
    }),

    // React integration for React applications.
    new ReactIntegration({
      router: createReactRouterV6Options({
        createRoutesFromChildren,
        matchRoutes,
        Routes,
        useLocation,
        useNavigationType
      })
    })
  ]
});

// push version using grafana faro

// This process.env. vars will be substituted at build time
// The VITE_APP_ prefix is mandatory for the substitution to work
window.versionData = cleanObj({
  version: import.meta.env.VITE_APP_VERSION,
  branch: import.meta.env.VITE_APP_BRANCH,
  commit: import.meta.env.VITE_APP_COMMIT
});

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <Provider store={store}>
    <PwaInstallProvider>
      <Router>
        <App />
      </Router>
    </PwaInstallProvider>
  </Provider>
);
