import React from "react";
import { render } from "react-dom";
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

// This process.env. vars will be substituted at build time
// The VITE_APP_ prefix is mandatory for the substitution to work
window.versionData = cleanObj({
  version: import.meta.env.VITE_APP_VERSION,
  branch: import.meta.env.VITE_APP_BRANCH,
  commit: import.meta.env.VITE_APP_COMMIT
});

render(
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>,
  document.getElementById("root")
);
