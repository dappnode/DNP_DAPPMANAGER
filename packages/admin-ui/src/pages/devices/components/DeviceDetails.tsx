import React, { useState, useEffect } from "react";
import { NavLink, RouteComponentProps } from "react-router-dom";
import { api, useApi } from "api";
import ClipboardJS from "clipboard";
// Own module
import { rootPath, title } from "../data";
// Components
import Card from "components/Card";
import Button from "components/Button";
import Input from "components/Input";
import QrCode from "components/QrCode";
import newTabProps from "utils/newTabProps";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
// Icons
import { MdOpenInNew } from "react-icons/md";
import { GoClippy } from "react-icons/go";
import Title from "components/Title";
import { ReqStatus } from "types";
import Ok from "components/Ok";

function DeviceDetailsLoaded({
  admin,
  id,
  url
}: {
  admin: boolean;
  id: string;
  url: string;
}) {
  const [showQr, setShowQr] = useState(false);
  const [password, setPassword] = useState<string>();
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  useEffect(() => {
    // Activate the copy functionality
    new ClipboardJS(".copy-input-copy");
  }, []);

  async function onGeneratePassword() {
    try {
      setReqStatus({ loading: true });
      const passwordRes = await api.devicePasswordGet({ id });
      setPassword(passwordRes);
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e });
      console.error("Error on devicePasswordGet", e);
    }
  }

  return (
    <Card className="device-settings">
      <header>
        <h5 className="card-title">{id || "Device not found"}</h5>

        <NavLink to={rootPath}>
          <Button>Back</Button>
        </NavLink>
      </header>

      {admin && (
        <span
          className={`stateBadge center badge-success`}
          style={{ opacity: 0.85, justifySelf: "left" }}
        >
          ADMIN
        </span>
      )}

      <div>
        <strong>Credentials URL</strong>

        <div className="help-text">
          Open the link below to get access to this device's credentials. You
          can share it through a secure channel.
        </div>

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
      </div>

      <Button onClick={() => setShowQr(!showQr)}>
        {showQr ? "Hide" : "Show"} QR code
      </Button>

      {showQr && url && <QrCode url={url} width={"400px"} />}

      {admin ? (
        <div>
          <strong>Admin password</strong>

          <div className="help-text">
            Share a unique password to grant external users acess. It will be
            revoked when deleting this device
          </div>

          {password ? (
            <Input
              lock={true}
              value={password || ""}
              onValueChange={() => {}}
              className="copy-input"
              append={
                <>
                  <Button
                    className="copy-input-copy"
                    data-clipboard-text={password}
                  >
                    <GoClippy />
                  </Button>
                </>
              }
            />
          ) : (
            <Button onClick={onGeneratePassword}>
              Generate new admin password
            </Button>
          )}

          <div className="request-status-container">
            {reqStatus.loading && (
              <Ok loading msg="Generating password..."></Ok>
            )}
            {reqStatus.result && <Ok ok msg="Generated password"></Ok>}
            {reqStatus.error && (
              <ErrorView error={reqStatus.error} hideIcon red />
            )}
          </div>
        </div>
      ) : null}

      <div className="alert alert-secondary" role="alert">
        Beware of shoulder surfing attacks (unsolicited observers), This data
        grants admin access to your DAppNode
      </div>
    </Card>
  );
}

export const DeviceDetails: React.FC<RouteComponentProps<{ id: string }>> = ({
  match
}) => {
  const id = match.params.id;
  const deviceCredentials = useApi.deviceCredentialsGet({ id });

  return (
    <>
      <Title title={title} subtitle={id} />

      {deviceCredentials.data ? (
        <DeviceDetailsLoaded
          admin={deviceCredentials.data.admin}
          id={id}
          url={deviceCredentials.data.url}
        />
      ) : deviceCredentials.error ? (
        <ErrorView error={deviceCredentials.error} />
      ) : deviceCredentials.isValidating ? (
        <Loading steps={["Loading device credentials"]} />
      ) : null}
    </>
  );
};
