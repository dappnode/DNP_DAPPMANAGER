import React, { useState, useEffect } from "react";
import { NavLink, RouteComponentProps } from "react-router-dom";
import { useApi } from "api";
import ClipboardJS from "clipboard";
// Own module
import { rootPath, subPaths, title } from "../../data";
// Components
import Form from "react-bootstrap/esm/Form";
import Alert from "react-bootstrap/esm/Alert";
import Card from "components/Card";
import Button from "components/Button";
import Input from "components/Input";
import QrCode from "components/QrCode";
import newTabProps from "utils/newTabProps";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
import Title from "components/Title";
// Icons
import { MdOpenInNew } from "react-icons/md";
import { GoClippy } from "react-icons/go";
import { urlJoin } from "utils/url";
import { VpnDeviceCredentials } from "@dappnode/common";

function OpenVpnDeviceDetailsLoaded({
  device
}: {
  device: VpnDeviceCredentials;
}) {
  const [showQr, setShowQr] = useState(false);
  const { id, url } = device;

  useEffect(() => {
    // Activate the copy functionality
    new ClipboardJS(".copy-input-copy");
  }, []);

  return (
    <Card className="device-settings" spacing>
      <header>
        <h5 className="card-title">{id || "Device not found"}</h5>

        <NavLink to={urlJoin(rootPath, subPaths.openVpn)}>
          <Button>Back</Button>
        </NavLink>
      </header>

      <Form.Group>
        <Form.Label>VPN credentials URL</Form.Label>
        <Input
          lock={true}
          value={url || ""}
          onValueChange={() => {}}
          className="copy-input"
          append={
            <>
              <Button className="copy-input-copy" data-clipboard-text={url}>
                <GoClippy />
              </Button>
              <Button className="copy-input-open">
                <a href={url} {...newTabProps} className="no-a-style">
                  <MdOpenInNew />
                </a>
              </Button>
            </>
          }
        />
      </Form.Group>

      <Button onClick={() => setShowQr(!showQr)}>
        {showQr ? "Hide" : "Show"} VPN credentials URL QR code
      </Button>

      {device.admin ? (
        device.hasChangedPassword ? (
          <Alert variant="info">
            This admin user has already changed the password. Only the initial
            auto-generated password is visible
          </Alert>
        ) : (
          <>
            <Form.Group>
              <Form.Label>Username</Form.Label>
              <Input
                lock={true}
                value={device.id || ""}
                onValueChange={() => {}}
                className="copy-input"
                append={
                  <>
                    <Button
                      className="copy-input-copy"
                      data-clipboard-text={device.id}
                    >
                      <GoClippy />
                    </Button>
                  </>
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Admin password</Form.Label>
              <Input
                lock={true}
                value={device.password || ""}
                onValueChange={() => {}}
                className="copy-input"
                append={
                  <>
                    <Button
                      className="copy-input-copy"
                      data-clipboard-text={device.password}
                    >
                      <GoClippy />
                    </Button>
                  </>
                }
              />
            </Form.Group>
          </>
        )
      ) : null}

      {showQr && url && <QrCode url={url} width={"400px"} />}

      <div className="alert alert-secondary" role="alert">
        Beware of shoulder surfing attacks (unsolicited observers), This data
        grants admin access to your DAppNode
      </div>
    </Card>
  );
}

export const OpenVpnDeviceDetails: React.FC<RouteComponentProps<{
  id: string;
}>> = ({ match }) => {
  const id = match.params.id;
  const deviceCredentials = useApi.deviceCredentialsGet({ id });

  return (
    <>
      <Title title={title} subtitle={id} />

      {deviceCredentials.data ? (
        <OpenVpnDeviceDetailsLoaded device={deviceCredentials.data} />
      ) : deviceCredentials.error ? (
        <ErrorView error={deviceCredentials.error} />
      ) : deviceCredentials.isValidating ? (
        <Loading steps={["Loading device credentials"]} />
      ) : null}
    </>
  );
};
