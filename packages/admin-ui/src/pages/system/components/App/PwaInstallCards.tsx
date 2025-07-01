import React from "react";
import Button from "components/Button";
import Card from "components/Card";
import QrCode from "components/QrCode";
import { relativePath as defaultVpnUrl } from "pages/vpn";
import { useNavigate } from "react-router-dom";
import { usePwaInstall } from "./PwaInstallContext";
import "./pwaInstallCards.scss";

export function PwaInstallCards({ pwaAppSubtabUrl }: { pwaAppSubtabUrl: string }) {
  const navigate = useNavigate();
  const { isPwa, canInstall, promptInstall } = usePwaInstall();

  return (
    <div>
      <h5>Requirements</h5>
      <div className="pwa-requirements-container">
        <Card>
          <div className="pwa-requirement">
          <h5>Configure VPN connection</h5>
            <p>
              Before installing the app, you must first configure a VPN connection on your preferred device.
              <br />
              Please follow the instructions in the VPN configuration section.
            </p>

            <Button variant="dappnode" onClick={() => navigate("/" + defaultVpnUrl)}>
              Configure VPN
            </Button>
          </div>
        </Card>

        <Card>
          <div className="pwa-requirement">
          <h5>Accept notification permission</h5>
            <p>
              To receive push notifications in your device, it's mandatory accept the notification permission in your
              browser.
              <br />
              <b>IMPORTANT:</b> Click the button below and click 'Allow' in the pop-up modal.
            </p>

            <Button variant="dappnode" 
            // onClick={() => navigate("/" + defaultVpnUrl)} //TODO: request browser permissions
              >
              Request permissions
            </Button>
          </div>
        </Card>
      </div>
      <br />
      <h5>Download App</h5>
      <div className="pwa-install-cards-container">
        {isPwa ? (
          <Card className="pwa-install-card">
            <h5>App already installed</h5>
            <p>You are already using the Dappnode's app in this device!</p>
          </Card>
        ) : canInstall ? (
          <Card className="pwa-install-card">
            <h5>Install app in this device</h5>
            <p>Click the button below, then click 'Install' in the pop-up modal.</p>
            <Button variant="dappnode" onClick={promptInstall} disabled={!canInstall}>
              Install App
            </Button>{" "}
          </Card>
        ) : (
          <Card className="pwa-install-card">
            <h5>App already installed</h5>
            <p>Find your app in your device home screen.</p>
          </Card>
        )}
        <Card className="pwa-install-card">
          <h5>Download app on another mobile device</h5>
          <p>Scan the QR code below to install Dappnode's mobile app.</p>
          <QrCode width={"200px"} url={pwaAppSubtabUrl} />
        </Card>
      </div>
    </div>
  );
}
