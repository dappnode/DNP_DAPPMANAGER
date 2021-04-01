import React, { useState } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { useApi } from "api";
import RenderMarkdown from "components/RenderMarkdown";
// Selectors
import {
  getCoreUpdateAvailable,
  getIsCoreUpdateTypePatch,
  getUpdatingCore
} from "services/coreUpdate/selectors";
import {
  getWifiStatus,
  getPasswordIsSecure
} from "services/dappnodeStatus/selectors";
import {
  rootPath as systemRootPath,
  subPaths as systemSubPaths
} from "pages/system/data";
import Alert from "react-bootstrap/Alert";
import Button from "components/Button";
// Style
import "./notificationsMain.scss";
import { autoUpdateIds } from "params";

/**
 * Aggregate notification and display logic
 */
export default function NotificationsView() {
  const coreUpdateAvailable = useSelector(getCoreUpdateAvailable);
  const updatingCore = useSelector(getUpdatingCore);
  const isCoreUpdateTypePatch = useSelector(getIsCoreUpdateTypePatch);
  const wifiStatus = useSelector(getWifiStatus);
  const passwordIsSecure = useSelector(getPasswordIsSecure);

  // Check is auto updates are enabled for the core
  const autoUpdateSettingsReq = useApi.autoUpdateDataGet();
  const isCoreAutoUpdateActive = (
    (autoUpdateSettingsReq.data?.settings || {})[
      autoUpdateIds.SYSTEM_PACKAGES
    ] || {}
  ).enabled;

  const notifications = [
    /**
     * [SYSTEM-UPDATE]
     * Tell the user to update the core DNPs
     */
    {
      id: "systemUpdate",
      linkText: "Update",
      linkPath: systemRootPath + "/" + systemSubPaths.update,
      body:
        "**DAppNode system update available.** Click **Update** to review and approve it",
      active:
        coreUpdateAvailable &&
        !updatingCore &&
        // Show if NOT patch, or if patch is must not be active
        (!isCoreUpdateTypePatch || !isCoreAutoUpdateActive)
    },
    /**
     * [WIFI-PASSWORD]
     * Tell the user to change the wifi credentials
     */
    {
      id: "wifiCredentials",
      linkText: "Change",
      linkPath: systemRootPath + "/" + systemSubPaths.security,
      body:
        "**Change the DAppNode WIFI credentials**, they are insecure default values.",
      active: wifiStatus?.isDefaultPassphrase && wifiStatus?.isRunning
    },
    /**
     * [HOST-USER-PASSWORD]
     * Tell the user to change the host's "dappnode" user password
     */
    {
      id: "hostPasswordInsecure",
      linkText: "Change",
      linkPath: systemRootPath + "/" + systemSubPaths.security,
      body:
        "**Change the host 'dappnode' user password**, it's an insecure default.",
      active: passwordIsSecure === false
    }
  ];

  return (
    <div>
      {notifications
        .filter(({ active }) => active)
        .map(({ id, linkText, linkPath, body }) => (
          <AlertDismissible key={id} {...{ linkText, linkPath, body }} />
        ))}
    </div>
  );
}

/**
 * Util component, alert banner that can be closed with an X button
 */
function AlertDismissible({
  body,
  linkText,
  linkPath
}: {
  body: string;
  linkText: string;
  linkPath: string;
}) {
  const [show, setShow] = useState(true);
  return show ? (
    <Alert
      variant="warning"
      onClose={() => setShow(false)}
      dismissible
      className="main-notification"
    >
      <RenderMarkdown source={body} />
      <NavLink to={linkPath}>
        <Button variant="warning">{linkText}</Button>
      </NavLink>
    </Alert>
  ) : null;
}
