import React from "react";
import Button from "components/Button";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
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
      <Card className="alert-warning">
        <h5>Required: Configure VPN connection!</h5>
        <div className="pwa-vpn-requirement">
          <div>
            Before installing the app, you must first configure a VPN connection on your preferred device.
            <br />
            Please follow the instructions in the VPN configuration section.
          </div>

          <Button variant="dappnode" onClick={() => navigate("/" + defaultVpnUrl)}>
            Configure VPN
          </Button>
        </div>
      </Card>
      <SubTitle>Download App</SubTitle>
      <div className="pwa-install-cards-container">
        {isPwa ? (
          <Card className="pwa-install-card">
            <h5>App already installed</h5>
            <p>You are already using the Dappnode's app in this device!</p>
          </Card>
        ) : canInstall ? (
          <Card className="pwa-install-card">
            <h5>Install app in this device</h5>
            <p>Click the button below, then click 'Install' in the pop-up modal</p>
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
