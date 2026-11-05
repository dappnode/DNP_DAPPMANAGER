import React from "react";
import Button from "components/Button";
import Card from "components/Card";
import QrCode from "components/QrCode";
import { relativePath as defaultVpnUrl } from "pages/vpn";
import { Link, useNavigate } from "react-router-dom";
import { usePwaInstall } from "./PwaInstallContext.js";
import { AlertDismissible } from "components/AlertDismissible";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";
import newTabProps from "utils/newTabProps";
import useDeviceInfo from "hooks/PWA/useDeviceInfo";
import { usePwaSubtabUrl } from "hooks/PWA/usePwaSubtabUrl";
import PwaInstallCards from "./PwaInstallCards.js";
import { docsUrl } from "params";
import "./pwaInstallScreen.scss";

export function PwaInstallScreen() {
  const navigate = useNavigate();
  const { isPwa, canInstall, promptInstall, wasInstalled, installLoading, isFullscreenOn } = usePwaInstall();
  const pwaSubtabUrl = usePwaSubtabUrl();
  const { permission } = useHandleSubscription();
  const { isMobile, browser, loading: deviceLoading, isCompatible, os, supportedBrowsers } = useDeviceInfo();

  const showQrCode = (): boolean => {
    if (isPwa) {
      return permission === "granted";
    }
    // If not a PWA and not on mobile, show QR code
    return !isMobile;
  };

  return (
    <div className="pwa-install-root">
      {!isPwa && (
        <AlertDismissible variant="info">
          <div className="pwa-vpn-info">
            <div>
              <h5>Set up your VPN before installing the app</h5>
              <div>
                To access the Dappnode App from outside the Dappnode Wi-Fi network, a VPN connection is required.
                <br />
                <ul>
                  <li>
                    <b>Tailscale:</b> Requires updated configuration. Follow the steps in{" "}
                    <Link to={docsUrl.tailscaleVpn} {...newTabProps}>
                      our Tailscale documentation
                    </Link>
                    .
                  </li>
                  <li>
                    <b>WireGuard:</b> No configuration changes needed.
                  </li>
                  <li>
                    <b>OpenVPN:</b> Currently not supported.
                  </li>
                </ul>
              </div>
            </div>

            <Button variant="dappnode" onClick={() => navigate("/" + defaultVpnUrl)}>
              Configure VPN
            </Button>
          </div>
        </AlertDismissible>
      )}

      {!deviceLoading && os !== "iOS" && browser !== "Chrome" && (
        <AlertDismissible variant="warning">
          <div className="pwa-vpn-info">
            <div>
              <h5>Chrome is recommended for the best experience</h5>
              <div>
                {browser === "Unknown" ? "Your browser was not identified. " : `You are using ${browser}. `}
                <br />
                For the best experience and full functionality, we recommend using Chrome to install the app on your
                device.
                {(browser === "Safari" || (browser === "Brave" && !isMobile)) && (
                  <>
                    {" "}
                    <br />
                    If you want to use the app in {browser}, please follow the instructions in our documentation.
                  </>
                )}
              </div>
            </div>
            {(browser === "Safari" || (browser === "Brave" && !isMobile)) && (
              <Button
                variant="warning"
                href={`${docsUrl.pwaHowToInstall}#${browser === "Safari" ? "safari" : "brave"}`}
                {...newTabProps}
              >
                Check Docs
              </Button>
            )}
          </div>
        </AlertDismissible>
      )}

      <div className="pwa-install-section">
        <div className="pwa-install-cards-container">
          <h5>Install app in this device</h5>
          <Card className="pwa-install-card">
            <PwaInstallCards
              isPwa={isPwa}
              canInstall={canInstall}
              promptInstall={promptInstall}
              wasInstalled={wasInstalled}
              installLoading={installLoading}
              isFullscreenOn={isFullscreenOn}
              deviceLoading={deviceLoading}
              isCompatible={isCompatible}
              os={os}
              browser={browser}
              supportedBrowsers={supportedBrowsers}
              pwaSubtabUrl={pwaSubtabUrl}
            />
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
