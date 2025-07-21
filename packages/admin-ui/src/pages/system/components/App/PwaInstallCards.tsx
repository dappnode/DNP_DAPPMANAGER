import React from "react";
import Button from "components/Button";
import { pathName as notisPathName, subPaths as notisSubpaths } from "pages/notifications";
import { useNavigate } from "react-router-dom";
import newTabProps from "utils/newTabProps";
import Loading from "components/Loading";
import { Browser, OS } from "hooks/PWA/useDeviceInfo";
import { MdIosShare } from "react-icons/md";

export interface PwaInstallCardsProps {
  isPwa: boolean;
  canInstall: boolean;
  installLoading: boolean;
  wasInstalled: boolean;
  isFullscreenOn: boolean;
  promptInstall: () => Promise<void>;
  deviceLoading: boolean;
  isCompatible: boolean;
  os: OS;
  browser: Browser;
  supportedBrowsers: Browser[];
  pwaSubtabUrl: string | undefined;
}

export default function PwaInstallCards({
  isPwa,
  canInstall,
  promptInstall,
  wasInstalled,
  installLoading,
  isFullscreenOn,
  deviceLoading,
  isCompatible,
  os,
  browser,
  supportedBrowsers,
  pwaSubtabUrl
}: PwaInstallCardsProps) {
  const devicesTabUrl = `/${notisPathName}/${notisSubpaths.devices}`;
  const navigate = useNavigate();

  if (deviceLoading) {
    return <Loading steps={["Device loading"]} />;
  }

  if (!isCompatible) {
    return (
      <div>
        <p>App not available for this browser.</p>
        <p>
          For {os} install the App via {supportedBrowsers.join(", ")}.
        </p>
      </div>
    );
  }

  if (isFullscreenOn) {
    return (
      <div>
        <h5>Exit full screen mode</h5>
        <p>To use and install the Dappnode App properly, please exit full screen mode.</p>
        <p>Some features may not work as expected while in full screen.</p>
      </div>
    );
  }

  if (isPwa) {
    return (
      <div>
        <p>Your App is successfully installed!</p>
        <p>You can now manage notifications for your devices in the Notifications tab.</p>
        <Button variant="dappnode" onClick={() => navigate(devicesTabUrl)}>
          Manage Devices
        </Button>
      </div>
    );
  }

  if (installLoading) {
    return <Loading steps={["Installing Dappnode App"]} />;
  }

  if (wasInstalled) {
    return (
      <div>
        <p>App has been installed successfully.</p>
        <p>Open the app and finish its setup.</p>
        <Button variant="dappnode" href={pwaSubtabUrl} {...newTabProps}>
          Finish Setup in App
        </Button>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div>
        <ol>
          <li>Click the button below to open the install prompt.</li>
          <li>
            Click <b>Install</b> in the dialog.
          </li>
        </ol>

        <Button variant="dappnode" onClick={promptInstall} disabled={!canInstall}>
          Install App
        </Button>
      </div>
    );
  }

  // iOS-specific flows
  if (os === "iOS") {
    if (browser === "Brave") {
      return (
        <div>
          <p>App installation is not compatible with the Brave browser on iOS.</p>
          <p>Switch to Chrome or Safari.</p>
        </div>
      );
    }
    return (
      <div>
        <p>To install the App:</p>
        <ol>
          <li>
            Tap the <MdIosShare /> icon in the browser toolbar
          </li>
          <li>
            Tap <b>Add to Home Screen</b>
          </li>
        </ol>
      </div>
    );
  }

  // macOS Safari
  if (os === "macOS" && browser === "Safari") {
    return (
      <div>
        <p>To install the App in Safari:</p>
        <ol>
          <li>
            Click the <MdIosShare /> icon in the browser toolbar
          </li>
          <li>
            Click the <b>Add to Dock</b>
          </li>
        </ol>
      </div>
    );
  }

  return <h5>App already installed.</h5>;
}
