import React from "react";
import Button from "components/Button";
import Card from "components/Card";
import QrCode from "components/QrCode";
import { relativePath as defaultVpnUrl } from "pages/vpn";
import { pathName as notisPathName, subPaths as notisSubpaths } from "pages/notifications";
import { Link, useNavigate } from "react-router-dom";
import { usePwaInstall } from "./PwaInstallContext";
import { AlertDismissible } from "components/AlertDismissible";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";
import newTabProps from "utils/newTabProps";
import Loading from "components/Loading";
import useDeviceInfo from "hooks/PWA/useDeviceInfo";
import { usePwaSubtabUrl } from "hooks/PWA/usePwaSubtabUrl";
import { MdIosShare } from "react-icons/md";
import { docsUrl } from "params";
import "./pwaInstallCards.scss";

export function PwaInstallCards() {
  const navigate = useNavigate();
  const { isPwa, canInstall, promptInstall, wasInstalled, installLoading, isFullscreenOn } = usePwaInstall();
  const pwaSubtabUrl = usePwaSubtabUrl();
  const { permission } = useHandleSubscription();
  const { isMobile, browser, loading: deviceLoading, isCompatible } = useDeviceInfo();
  const devicesTabUrl = `/${notisPathName}/${notisSubpaths.devices}`;

  const showQrCode = (): boolean => {
    if (isPwa) {
      return permission === "granted";
    }
    // If not a PWA and not on mobile, show QR code
    return !isMobile;
  };

  return (
    <div className="pwa-install-root">
      {isFullscreenOn ? (
        <Card>
          <div className="fullscreen-card">
            <h5>Exit full screen mode</h5>
            <p>To use and install the Dappnode App properly, please exit full screen mode.</p>
            Some features may not work as expected while in full screen.
          </div>
        </Card>
      ) : (
        <>
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
                {isPwa ? (
                  <div>
                    <p>Your App is successfully installed!</p>

                    <p>You can now manage notifications for your devices in the Notifications tab.</p>
                    <Button variant="dappnode" onClick={() => navigate(devicesTabUrl)}>
                      Manage Devices
                    </Button>
                  </div>
                ) : canInstall ? (
                  <div>
                    <p>
                      Click the button below, then click <b>Install</b> in the pop-up modal.
                    </p>
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
                ) : browser === "Safari" ? (
                  isMobile ? (
                    <div>
                      <p>
                        To install the App in Safari click the <MdIosShare /> icon at the bottom of the screen <br />
                        and scroll down in the options and tap <b>Add to Home Screen</b>
                      </p>

                      <p>
                        After that, open the App and navigate to <i>System &gt; App</i> to finish the App setup
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>
                        To install the App in Safari click the <MdIosShare /> icon in the Safari toolbar and click{" "}
                        <b>Add to Dock</b>
                      </p>

                      <p>
                        After that, open the App and navigate to <i>System &gt; App</i> to finish the setup
                      </p>
                    </div>
                  )
                ) : isCompatible ? (
                  <div>
                    <p>App already installed</p>
                    <p>Open your app in your device home screen to continue.</p>
                  </div>
                ) : (
                  <div>App not available for this browser.</div>
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
        </>
      )}
    </div>
  );
}
