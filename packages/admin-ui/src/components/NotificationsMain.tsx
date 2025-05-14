import React from "react";
import { NavLink } from "react-router-dom";
import RenderMarkdown from "components/RenderMarkdown";
// Selectors
import Button from "components/Button";
// Style
import "./notificationsMain.scss";
import { AlertDismissible } from "./AlertDismissible";

/**
 * Aggregate notification and display logic
 */
export default function NotificationsView() {
  const notifications: {
    id: string;
    linkText?: string;
    linkPath?: string;
    body: string;
    active: boolean;
  }[] = [];

  return (
    <div>
      {notifications
        .filter(({ active }) => active)
        .map(({ id, linkText, linkPath, body }) => (
          <AlertDismissible key={id} className="main-notification" variant="warning">
            <RenderMarkdown source={body} />
            {linkText && linkPath ? (
              <NavLink to={linkPath}>
                <Button variant="warning">{linkText}</Button>
              </NavLink>
            ) : null}
          </AlertDismissible>
        ))}
    </div>
  );
}
