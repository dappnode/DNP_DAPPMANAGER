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
      <Card>
        <h5>Required: Configure VPN connection!</h5>
        <div className="pwa-vpn-requirement">
          <div>
            To install the DappManager as an App (PWA), you must first configure a VPN connection in the device you want
            to install it.
            <br />
            Please follow the instructions in the VPN Configuration section to set up your VPN connection before
            proceeding with the PWA installation.
          </div>

          <Button variant="dappnode" onClick={() => navigate(defaultVpnUrl)}>
            Configure VPN
          </Button>
        </div>
      </Card>
      <SubTitle>Download App</SubTitle>
      <div className="pwa-install-cards-container">
        {isPwa ? (
          <Card>
            <p>You are already using the Dappnode's app in this device!</p>
          </Card>
        ) : canInstall ? (
          <Card>
            <h5>Download app in this device</h5>
            <p>Install Dappnode's app in this device. </p>
            <Button variant="dappnode" onClick={promptInstall} disabled={!canInstall}>
              Install PWA
            </Button>{" "}
          </Card>
        ) : (
          <Card>
            <h5>App already installed</h5>
            <p>
              The Dappnode's app is already installed. To open it, locate the app on your device's home screen or app
              drawer and tap to launch it.
            </p>
          </Card>
        )}
        <Card>
          <h4>Download app on another mobile device</h4>
          <p>
            Scan the QR code below after setting the VPN connection in your phone to download Dappnode's mobile app for
            free
          </p>
          <QrCode width={"200px"} url={pwaAppSubtabUrl} />
        </Card>
      </div>
    </div>
  );
}
