import React from "react";
import SubTitle from "components/SubTitle";
import { AlertDismissible } from "components/AlertDismissible";
import { Link } from "react-router-dom";
import { docsUrl } from "params";
import { subPaths } from "pages/notifications/index";

import { TelegramNotifications } from "./Telegram";
import EthicalMetrics from "./EthicalMetrics";
import "./notifications.scss";

export function LegacyNotifications() {
  return (
    <>
      <AlertDismissible variant="warning">
        <h4>📣 Legacy Notifications will be deprecated!</h4>
        <p>
          The current notification system using email and Telegram will be deprecated in upcoming Dappnode core
          releases. We're transitioning to a new and improved in-app Notifications experience, designed to be more
          reliable, configurable and scalable.
        </p>
        <p>
          🔁 To enable them, make sure you check out the new{" "}
          <Link to={`/notifications/${subPaths.settings}`}>
            Settings Notifications tab
          </Link>{" "}
          <br />
          📘 For full details about the new system, see our{" "}
          <Link to={docsUrl.notificationsOverview} target="_blank" rel="noopener noreferrer">
            Notifications Documentation
          </Link>
          .
        </p>
      </AlertDismissible>

      <SubTitle>Ethical metrics</SubTitle>
      <EthicalMetrics />

      <SubTitle>Telegram</SubTitle>
      <TelegramNotifications />
    </>
  );
}
