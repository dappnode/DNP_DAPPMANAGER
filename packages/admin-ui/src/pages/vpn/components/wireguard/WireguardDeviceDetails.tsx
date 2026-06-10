import React, { useState, useEffect } from "react";
import { NavLink, useParams } from "react-router-dom";
import { useApi } from "api";
import ClipboardJS from "clipboard";
// Own module
import { rootPath, subPaths } from "../../data";
// Components
import Form from "react-bootstrap/esm/Form";
import Card from "components/Card";
import Button from "components/Button";
import QrCode from "components/QrCode";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
import { apiRoutes } from "api";
// Icons
import { FiDownload } from "react-icons/fi";
import { GoCopy } from "react-icons/go";
import { FaQrcode } from "react-icons/fa";
// Utils
import { urlJoin } from "utils/url";
import SubTitle from "components/SubTitle";

function WireguardDeviceDetailsLoaded({
  id,
  config,
  showLocalCreds,
  setShowLocalCreds,
  isLoadingLocalConfig,
  localConfigError
}: {
  id: string;
  config: string;
  showLocalCreds: boolean;
  setShowLocalCreds: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingLocalConfig?: boolean;
  localConfigError?: Error;
}) {
  const [showQr, setShowQr] = useState(false);
  const isShowingLocalConfig = showLocalCreds && !isLoadingLocalConfig && !localConfigError;
  const configType = isShowingLocalConfig ? "local" : "";

  useEffect(() => {
    // Activate the copy functionality
    new ClipboardJS(".btn");
  }, []);

  return (
    <Card className="wireguard-device-settings" spacing>
      <header>
        <h5 className="card-title">{id || "Device not found"}</h5>

        <NavLink to={urlJoin(rootPath, subPaths.wireguard)}>
          <Button>Back</Button>
        </NavLink>
      </header>

      <div className="help-text">
        Add the following VPN configuration in your Wireguard client.
        <br /> <br />
        In case you experience issues connecting from the same network as your dappnode, use the local credentials.{" "}
        <span className="show-local-credentials" onClick={() => setShowLocalCreds((x) => !x)}>
          {showLocalCreds ? "Go back to showing remote credentials" : "Show local credentials"}
        </span>
      </div>

      <div className="buttons">
        <a
          href={apiRoutes.downloadWireguardConfig({
            device: id,
            isLocal: isShowingLocalConfig
          })}
        >
          <Button>
            <span>
              <FiDownload />
              <span>Download {configType} config</span>
            </span>
          </Button>
        </a>

        <Button data-clipboard-text={config}>
          <span>
            <GoCopy />
            <span>Copy {configType} config</span>
          </span>
        </Button>

        <Button onClick={() => setShowQr(!showQr)}>
          <span>
            <FaQrcode />
            <span>
              {showQr ? "Hide" : "Show"} {configType} config QR code
            </span>
          </span>
        </Button>
      </div>

      {isLoadingLocalConfig && (
        <div className="alert alert-secondary" role="alert">
          Loading local credentials. Remote credentials are shown below.
        </div>
      )}

      {localConfigError && (
        <div className="alert alert-warning" role="alert">
          Local credentials could not be loaded. Use the remote credentials shown below instead.
        </div>
      )}

      <Form.Group>
        <Form.Label>VPN {configType} credentials</Form.Label>
        <div className="credentials-config">{config}</div>
      </Form.Group>

      {showQr && config && <QrCode url={config} width={"400px"} />}

      <div className="alert alert-secondary" role="alert">
        Beware of shoulder surfing attacks (unsolicited observers), This data grants access to your DAppNode
      </div>
    </Card>
  );
}

function WireguardDeviceDetailsWithLocal({
  id,
  configRemote,
  setShowLocalCreds
}: {
  id: string;
  configRemote: string;
  setShowLocalCreds: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const localConfig = useApi.wireguardDeviceConfigGet({ device: id, isLocal: true });

  return (
    <WireguardDeviceDetailsLoaded
      id={id}
      config={localConfig.data || configRemote}
      showLocalCreds={true}
      setShowLocalCreds={setShowLocalCreds}
      isLoadingLocalConfig={localConfig.isValidating && !localConfig.data && !localConfig.error}
      localConfigError={localConfig.error}
    />
  );
}

export const WireguardDeviceDetails: React.FC = () => {
  const params = useParams();
  const id = params.id || "";
  const [showLocalCreds, setShowLocalCreds] = useState(false);
  const config = useApi.wireguardDeviceConfigGet({ device: id, isLocal: false });

  return (
    <>
      <SubTitle>{id}</SubTitle>

      {config.data ? (
        showLocalCreds ? (
          <WireguardDeviceDetailsWithLocal id={id} configRemote={config.data} setShowLocalCreds={setShowLocalCreds} />
        ) : (
          <WireguardDeviceDetailsLoaded
            id={id}
            config={config.data}
            showLocalCreds={showLocalCreds}
            setShowLocalCreds={setShowLocalCreds}
          />
        )
      ) : config.error ? (
        <ErrorView error={config.error} />
      ) : config.isValidating ? (
        <Loading steps={["Loading device credentials"]} />
      ) : null}
    </>
  );
};
