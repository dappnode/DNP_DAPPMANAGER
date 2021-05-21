import React, { useState, useEffect } from "react";
import { NavLink, RouteComponentProps } from "react-router-dom";
import { useApi } from "api";
import ClipboardJS from "clipboard";
// Own module
import { rootPath, subPaths, title } from "../../data";
// Components
import Form from "react-bootstrap/esm/Form";
import Card from "components/Card";
import Button from "components/Button";
import QrCode from "components/QrCode";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
import Title from "components/Title";
// Icons
import { GoClippy } from "react-icons/go";
import { FaQrcode } from "react-icons/fa";
import { WireguardDeviceCredentials } from "types";
// Utils
import { urlJoin } from "utils/url";

function WireguardCredentialsHeader({ id }: { id: string }) {
  return (
    <>
      <header>
        <h5 className="card-title">{id || "Device not found"}</h5>

        <NavLink to={urlJoin(rootPath, subPaths.wireguard)}>
          <Button>Back</Button>
        </NavLink>
      </header>

      <div className="help-text">
        Use the VPN credentials URL to connect a new device to this DAppNode.
        You can then use the user and admin password to log in to the UI. You
        can share them with a trusted person through a secure channel.
      </div>

      <div className="alert alert-secondary" role="definition">
        Use remote credentials by default. In case of your router does not
        support NAT loopback use local credentials
      </div>
    </>
  );
}

function WireguardCredentialsFooter() {
  return (
    <div className="alert alert-secondary" role="alert">
      Beware of shoulder surfing attacks (unsolicited observers), This data
      grants admin access to your DAppNode
    </div>
  );
}

function WireguardCredentialsForm({
  configType,
  type
}: {
  configType: string;
  type: "local" | "remote";
}) {
  return (
    <Form.Group>
      <Form.Label>VPN {type} credentials URL</Form.Label>
      <div className="credentials-config">{configType}</div>
    </Form.Group>
  );
}

function WireguardDeviceDetailsLoaded({
  id,
  device
}: {
  id: string;
  device: WireguardDeviceCredentials;
}) {
  const [showQrRemote, setShowQrRemote] = useState(false);
  const [showQrLocal, setShowQrLocal] = useState(false);
  const [showCreds, setShowCreds] = useState("");
  const { configRemote, configLocal } = device;

  useEffect(() => {
    // Activate the copy functionality
    new ClipboardJS(".copy-input-copy");
  }, []);

  return (
    <Card className="wireguard-device-settings" spacing>
      <WireguardCredentialsHeader id={id} />

      <div className="buttons">
        <Button onClick={() => setShowCreds("remote")}>
          Remote credentials
        </Button>
        <Button onClick={() => setShowCreds("local")}>Local credentials</Button>
      </div>
      {showCreds === "remote" ? (
        <>
          <WireguardCredentialsForm configType={configRemote} type={"remote"} />
          <div className="buttons">
            <Button data-clipboard-text={configRemote}>
              <span>
                <GoClippy />
                <span>Copy remote config</span>
              </span>
            </Button>

            <Button onClick={() => setShowQrRemote(!showQrRemote)}>
              <span>
                <FaQrcode />
                <span>
                  {showQrRemote ? "Hide" : "Show"} remote config QR code
                </span>
              </span>
            </Button>
          </div>
          {showQrRemote && configRemote && (
            <QrCode url={configRemote} width={"400px"} />
          )}
        </>
      ) : showCreds === "local" ? (
        <>
          <WireguardCredentialsForm configType={configLocal} type={"local"} />
          <div className="buttons">
            <Button data-clipboard-text={configLocal}>
              <span>
                <GoClippy />
                <span>Copy local config</span>
              </span>
            </Button>

            <Button onClick={() => setShowQrLocal(!showQrLocal)}>
              <span>
                <FaQrcode />
                <span>
                  {showQrLocal ? "Hide" : "Show"} local config QR code
                </span>
              </span>
            </Button>
          </div>

          {showQrLocal && configLocal && (
            <QrCode url={configLocal} width={"400px"} />
          )}
        </>
      ) : null}

      <WireguardCredentialsFooter />
    </Card>
  );
}

export const WireguardDeviceDetails: React.FC<RouteComponentProps<{
  id: string;
}>> = ({ match }) => {
  const id = match.params.id;
  const device = useApi.wireguardDeviceGet(id);

  return (
    <>
      <Title title={title} subtitle={id} />

      {device.data ? (
        <WireguardDeviceDetailsLoaded id={id} device={device.data} />
      ) : device.error ? (
        <ErrorView error={device.error} />
      ) : device.isValidating ? (
        <Loading steps={["Loading device credentials"]} />
      ) : null}
    </>
  );
};
