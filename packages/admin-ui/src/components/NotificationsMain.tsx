import React from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import RenderMarkdown from "components/RenderMarkdown";
// Selectors
import { getWifiStatus } from "services/dappnodeStatus/selectors";
import { pathName as systemPathName, subPaths as systemSubPaths } from "pages/system/data";
import Button from "components/Button";
// Style
import "./notificationsMain.scss";
import { AlertDismissible } from "./AlertDismissible";

/**
 * Aggregate notification and display logic
 */
export default function NotificationsView() {
  const wifiStatus = useSelector(getWifiStatus);

  const notifications = [
    /**
     * [WIFI-PASSWORD]
     * Tell the user to change the wifi credentials
     */
    {
      id: "wifiCredentials",
      linkText: "Change",
      linkPath: systemPathName + "/" + systemSubPaths.security,
      body: "**Change the Dappnode WiFi credentials**, they are insecure default values.",
      active: wifiStatus?.isDefaultPassphrase && wifiStatus?.isRunning
    }
  ];

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
