import React from "react";
import Button from "components/Button";
import Card from "components/Card";
import QrCode from "components/QrCode";
import { relativePath as defaultVpnUrl } from "pages/vpn";
import { pathName as notisPathName, subPaths as notisSubpaths } from "pages/notifications";
import { useNavigate } from "react-router-dom";
import { usePwaInstall } from "./PwaInstallContext";
import "./pwaInstallCards.scss";
import { AlertDismissible } from "components/AlertDismissible";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";
import newTabProps from "utils/newTabProps";
import Loading from "components/Loading";
import useDeviceInfo from "hooks/PWA/useDeviceInfo";
import { usePwaSubtabUrl } from "hooks/PWA/usePwaSubtabUrl";

export function PwaInstallCards() {
  const navigate = useNavigate();
  const { isPwa, canInstall, promptInstall, wasInstalled, installLoading } = usePwaInstall();
  const pwaSubtabUrl = usePwaSubtabUrl();
  const { permission, requestPermission, isSubscribing, permissionLoading } = useHandleSubscription();
  const { isMobile, browser, loading: deviceLoading } = useDeviceInfo();
  const devicesTabUrl = `/${notisPathName}/${notisSubpaths.devices}`;

  const showQrCode = (): boolean => {
    if (isPwa) {
      return permission === "granted";
    }
    // If not a PWA and not on mobile, show QR code
    return !isMobile;
  };

  return (
    <div>
      {!isPwa && (
        <AlertDismissible variant="info">
          <div className="pwa-vpn-info">
            <div>
              <h5>Configure VPN connection before installing the app</h5>
              <div>
                To connect to the Dappnode App from outside the Dappnode-Wifi network, its mandatory to set a VPN
                connection.
                <br />
                We highly encourage to set a VPN connection on your preferred device.
              </div>
            </div>

            <Button variant="dappnode" onClick={() => navigate("/" + defaultVpnUrl)}>
              Configure VPN
            </Button>
          </div>
        </AlertDismissible>
      )}
      {!deviceLoading && browser !== "Chrome" && (
        <AlertDismissible variant="warning">
          <div className="pwa-vpn-info">
            <div>
              <h5>Chrome is recommended for the best experience</h5>
              <div>
                {browser === "Unknown" ? "Your browser was not identified. " : `You are using ${browser}. `}
                <br />
                For the best experience and full functionality, we recommend using Chrome to install the app on your
                device.
              </div>
            </div>
            {/* TODO: Include link to docs on how install PWA manually. */}
            <Button variant="warning" href="https://docs.dappnode.io/" {...newTabProps}>
              Check Docs
            </Button>
          </div>
        </AlertDismissible>
      )}
      <div className="pwa-install-section">
        <div className="pwa-install-cards-container">
          <h5>Install app in this device</h5>
          <Card className="pwa-install-card">
            {isPwa ? (
              permission && permissionLoading ? (
                <Loading steps={["Waiting for permissions approval"]} />
              ) : permission === "default" ? (
                <div>
                  <p>
                    To receive notifications in your device, it's mandatory granting the notification permission in your
                    App.
                  </p>
                  <p>
                    Click the button below and then <b>click 'Allow' in the pop-up modal</b>.
                  </p>

                  <Button variant="dappnode" onClick={requestPermission}>
                    Grant permission
                  </Button>
                </div>
              ) : permission === "denied" ? (
                <div>
                  <p>Notifications permission denied.</p>
                  <p>Grant notification permission for this App in your browser settings to receive notifications.</p>
                  {/* TODO: Include link to docs on how install PWA manually. */}
                  <Button variant="warning" href="https://docs.dappnode.io/" {...newTabProps}>
                    Check Docs
                  </Button>
                </div>
              ) : permission === "granted" && isSubscribing ? (
                <Loading steps={["Subscribing device"]} />
              ) : (
                <div>
                  <p>Your App is successfully configured!</p>

                  <p>You can now manage notifications for your devices in the Notifications tab.</p>
                  <Button variant="dappnode" onClick={() => navigate(devicesTabUrl)}>
                    Manage Devices
                  </Button>
                </div>
              )
            ) : canInstall ? (
              <div>
                <p>Click the button below, then click 'Install' in the pop-up modal.</p>
                <Button variant="dappnode" onClick={promptInstall} disabled={!canInstall}>
                  Install App
                </Button>
              </div>
            ) : installLoading ? (
              <Loading steps={["Installing Dappnode App"]} />
            ) : wasInstalled ? (
              <div>
                <p>App has been installed successfully</p>
                <p>Open the app and finish its setup.</p>

                <Button variant="dappnode" href={pwaSubtabUrl} {...newTabProps}>
                  Finish Setup in App{" "}
                </Button>
              </div>
            ) : (
              <div>
                <p>App already installed or not available for this browser</p>
                <p>If installed, open your app in your device home screen.</p>
              </div>
            )}
          </Card>
        </div>
        {pwaSubtabUrl && showQrCode() && (
          <div className="pwa-install-cards-container">
            <h5>Install app on another mobile device</h5>
            <Card className="pwa-install-card">
              <p>Scan the QR code below to install Dappnode's mobile app.</p>
              <QrCode width={"200px"} url={pwaSubtabUrl} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
