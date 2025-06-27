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
        <h3>Required: Configure VPN connection</h3>
        <div>
          <p>
            To install the DappManager as an App (PWA), you must first configure a VPN connection in the device you want
            to install it.
          </p>
          <p>
            Please follow the instructions in the VPN Configuration section to set up your VPN connection before
            proceeding with the PWA installation.
          </p>
          <Button variant="dappnode" onClick={() => navigate(defaultVpnUrl)}>
            Configure VPN
          </Button>
        </div>
      </Card>
      <SubTitle>Download App</SubTitle>
      <div className="pwa-install-cards-container">
        <Card>
          <h3>Scan URL's app</h3>
          <p>
            Scan the QR code below after setting the VPN connection in your phone to download Dappnode's mobile app for
            free
          </p>
          <QrCode width={"200px"} url={pwaAppSubtabUrl} />
        </Card>

        {isPwa ? (
          <Card>
            <p>You are already using the Dappnode's app in this device!</p>
          </Card>
        ) : canInstall ? (
          <Card>
            <h3>Download app</h3>
            <p>Install Dappnode's app in this device. </p>
            <Button variant="dappnode" onClick={promptInstall} disabled={!canInstall}>
              Install PWA
            </Button>{" "}
          </Card>
        ) : (
          <Card>
            <h3>App already installed</h3>
            <p>
              The Dappnode's app is already installed. To open it, locate the app on your device's home screen or app
              drawer and tap to launch it.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
