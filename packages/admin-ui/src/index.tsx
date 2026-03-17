import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";

import { store } from "./store";
import App from "./App";
import { cleanObj } from "utils/objects";

// Init css
import "react-toastify/dist/ReactToastify.css";
// Bootstrap — scoped under .legacy-bootstrap so it only affects legacy /staking/* routes
import "./styles/bootstrap-scoped.scss";
// Custom styles

// Tailwind CSS v4 — isolated, prefixed, no preflight
import "./styles/tailwind.css";
import { PwaInstallProvider } from "pages/system/components/App/PwaInstallContext";

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
