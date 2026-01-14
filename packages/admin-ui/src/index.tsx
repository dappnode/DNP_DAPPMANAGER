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
import { PwaInstallProvider } from "pages/system/components/App/PwaInstallContext";
import { initializeFaro, InternalLoggerLevel } from "@grafana/faro-web-sdk";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

initializeFaro({
  url: "http://alloy.dms.dappnode:12345/collect",
  app: {
    name: "frontend",
    version: "1.0.0"
  },
  internalLoggerLevel: InternalLoggerLevel.VERBOSE // Possible values are: OFF, ERROR, WARN, INFO, VERBOSE
});

// This process.env. vars will be substituted at build time
// The VITE_APP_ prefix is mandatory for the substitution to work
window.versionData = cleanObj({
  version: import.meta.env.VITE_APP_VERSION,
  branch: import.meta.env.VITE_APP_BRANCH,
  commit: import.meta.env.VITE_APP_COMMIT
});

console.error("ffff");

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
