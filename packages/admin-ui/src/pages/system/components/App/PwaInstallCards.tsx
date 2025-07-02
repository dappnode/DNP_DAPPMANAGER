import React from "react";
import Button from "components/Button";
import Card from "components/Card";
import QrCode from "components/QrCode";
import { relativePath as defaultVpnUrl } from "pages/vpn";
import { useNavigate } from "react-router-dom";
import { usePwaInstall } from "./PwaInstallContext";
import "./pwaInstallCards.scss";
import { AlertDismissible } from "components/AlertDismissible";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";
import newTabProps from "utils/newTabProps";
import Loading from "components/Loading";

export function PwaInstallCards({ pwaAppSubtabUrl }: { pwaAppSubtabUrl: string }) {
  const navigate = useNavigate();
  const { isPwa, canInstall, promptInstall, wasInstalled, installLoading } = usePwaInstall();
  const { permission, requestPermission } = useHandleSubscription();

  return (
    <div>
      <AlertDismissible variant="info">
        <div className="pwa-vpn-info">
          <div>
            <h5>Configure VPN connection</h5>
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
      <div className="pwa-install-cards-container">
        <div>
          <h5>Install app in this device</h5>
          <Card className="pwa-install-card">
            {isPwa ? (
              permission && permission === "default" ? (
                <>
                  <p>
                    To receive push notifications in your device, it's mandatory accept the notification permission in
                    your browser.
                    <br />
                    <b>IMPORTANT:</b> Click the button below and click 'Allow' in the pop-up modal.
                  </p>

                  <Button
                    variant="dappnode"
                    onClick={requestPermission} //TODO: request browser permissions
                  >
                    Request permissions
                  </Button>
                </>
              ) : permission === "denied" ? (
                <>
                  <p>
                    Permission denied. Please enable notifications in your browser settings to receive notifications.
                  </p>
                  <p>Link to docs -- how to reset browser permissions</p>
                </>
              ) : (
                permission === "granted" && (
                  <>
                    <p>
                      Check your device notification status in <i>notifications/devices</i>
                    </p>
                  </>
                )
              )
            ) : canInstall ? (
              <>
                <p>Click the button below, then click 'Install' in the pop-up modal.</p>
                <Button variant="dappnode" onClick={promptInstall} disabled={!canInstall}>
                  Install App
                </Button>
              </>
            ) : installLoading ? (
              <Loading steps={["Installing Dappnode App"]} />
            ) : wasInstalled ? (
              <>
                <p>App has been installed succefully</p>
                <p>Please, click the button below to open the app and finish its set up.</p>

                <Button href={pwaAppSubtabUrl} {...newTabProps}>
                  Open App
                </Button>
              </>
            ) : (
              <>
                <p>App already installed or not available for this browser</p>
                <p>If installed, open your app in your device home screen.</p>
              </>
            )}
          </Card>
        </div>
        <div>
          <h5>Install app on another mobile device</h5>
          <Card className="pwa-install-card">
            <p>Scan the QR code below to install Dappnode's mobile app.</p>
            <QrCode width={"200px"} url={pwaAppSubtabUrl} />
          </Card>
        </div>
      </div>
    </div>
  );
}
