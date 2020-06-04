import React, { useState, useEffect } from "react";
import { NavLink, RouteComponentProps } from "react-router-dom";
import useSWR from "swr";
import { api } from "api";
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
import Error from "components/Error";
// Icons
import { MdOpenInNew } from "react-icons/md";
import { GoClippy } from "react-icons/go";
import Title from "components/Title";

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

  useEffect(() => {
    // Activate the copy functionality
    new ClipboardJS(".copy-input-copy");
  }, []);

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

      <div className="help-text">
        Open the link below to get access to this device's credentials. You can
        share it with external users to give them access to your DAppNode.
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

      <div className="alert alert-secondary" role="alert">
        Beware of shoulder surfing attacks (unsolicited observers), This QR code
        will grant them access to your DAppNode
      </div>

      <Button onClick={() => setShowQr(!showQr)}>
        {showQr ? "Hide" : "Show"} QR code
      </Button>

      {showQr && url && <QrCode url={url} width={"400px"} />}
    </Card>
  );
}

export const DeviceDetails: React.FC<RouteComponentProps<{ id: string }>> = ({
  match
}) => {
  const id = match.params.id;
  const { data: credentials, error, isValidating } = useSWR(
    [id, "deviceCredentialsGet"],
    id => api.deviceCredentialsGet({ id })
  );

  return (
    <>
      <Title title={title} subtitle={id} />

      {credentials ? (
        <DeviceDetailsLoaded admin={false} id={id} url={credentials.url} />
      ) : isValidating ? (
        <Loading msg="Loading device credentials..." />
      ) : error ? (
        <Error msg={`Error loading device credentials: ${error}`} />
      ) : null}
    </>
  );
};
