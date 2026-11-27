import React from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { basePath as stakersBasePath, relativePath as stakersPath } from "pages/stakers";
import { Network, NetworkStatus, NodeStatus } from "@dappnode/types";
import newTabProps from "utils/newTabProps";
import { gweiToToken } from "utils/gweiToToken";
import { capitalize } from "utils/strings";
import Card from "components/Card";
import Loading from "components/Loading";
import Button from "components/Button";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { HealthIcon } from "./icons/HealthIcon";
import { BoltIcon } from "./icons/BoltIcon";
import { RewardsIcon } from "./icons/RewardsIcon";
import { MdCheckCircleOutline, MdInfoOutline, MdWarningAmber } from "react-icons/md";
import { ClientSyncStatus, getReadiness } from "./ClientSyncStatus";

const NetworkCard = ({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card className="network-stats-card">
    <div className="network-card-header">
      <div className="network-card-icon">{icon}</div>
      <div className="network-card-title">{title}</div>
    </div>
    {children}
  </Card>
);

export const StatusCard = ({
  network,
  data,
  clientsLoading,
  clientsDnps
}: {
  network: string;
  data: NodeStatus | undefined;
  clientsLoading: boolean;
  clientsDnps?: {
    ecDnp: string | null;
    ccDnp: string | null;
  };
}) => {
  const navigate = useNavigate();
  const ecResult = data?.ec ?? null;
  const ccResult = data?.cc ?? null;
  const readiness = getReadiness(ecResult, ccResult);

  return (
    <NetworkCard title="NODE STATUS" icon={<HealthIcon />}>
      {clientsLoading ? (
        <Loading small />
      ) : data ? (
        <div className="status-card-container">
          <div className={`node-readiness ${readiness.ready ? "ready" : "not-ready"}`}>
            {readiness.ready ? <MdCheckCircleOutline /> : <MdInfoOutline />} {readiness.reason}
          </div>

          <ClientSyncStatus
            label="EXECUTION"
            layer="execution"
            network={network}
            dnpName={clientsDnps?.ecDnp ?? null}
            result={ecResult}
          />

          <hr />

          <ClientSyncStatus
            label="CONSENSUS"
            layer="consensus"
            network={network}
            dnpName={clientsDnps?.ccDnp ?? null}
            result={ccResult}
          />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>Data could not be fetched</div>
      )}

      <Button
        onClick={() => navigate("/" + stakersBasePath + `/${network === Network.Mainnet ? "ethereum" : network}`)}
        fullwidth
        variant="outline-dappnode"
      >
        <span>View Setup</span>
      </Button>
    </NetworkCard>
  );
};

export const ValidatorsCard = ({
  network,
  validatorsLoading,
  data
}: {
  network: string;
  validatorsLoading: boolean;
  data: NetworkStatus["validators"];
}) => {
  const signerInstalled = data?.signerStatus.isInstalled;
  const brainRunning = data?.signerStatus.brainRunning;
  const navigate = useNavigate();

  return (
    <NetworkCard title="YOUR VALIDATORS" icon={<BoltIcon />}>
      {validatorsLoading ? (
        <Loading small />
      ) : !signerInstalled || !brainRunning ? (
        <div className="signer-error-card">
          <div />
          <div>
            <div className="error-message">
              <MdWarningAmber className="warning-icon" />{" "}
              <div>
                {!signerInstalled
                  ? "Web3Signer is not installed on this network."
                  : "Web3Signer is not running properly on this network."}
              </div>
            </div>
            <div className="action-text">Select Web3Signer in the stakers tab and apply changes.</div>
          </div>
          <Button
            onClick={() => navigate("/" + stakersBasePath + `/${network === Network.Mainnet ? "ethereum" : network}`)}
            fullwidth
            variant="outline-dappnode"
          >
            <span>Set Web3Signer</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="validators-card-container">
            <div className="validators-row">
              <div className="network-stat-col">
                <div>
                  TOTAL{" "}
                  {data?.beaconError && (
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="beacon-api-error">
                          Error fetching {capitalize(network)} validators status. All keystores imported in your{" "}
                          {capitalize(network)} Web3Signer are being considered as active validators.
                        </Tooltip>
                      }
                      placement="top"
                    >
                      <span>
                        <MdWarningAmber className="tooltip-beacon-api-error" />{" "}
                      </span>
                    </OverlayTrigger>
                  )}
                </div>
                <span>{data?.total ?? "0"}</span>
              </div>
              <div className="network-stat-col">
                <div>STATUS</div>
                {renderAttestingStatus(data?.attesting ?? 0, data?.total ?? 0)}
              </div>
            </div>
            <hr />
            <div className="validators-row">
              <div className="network-stat-col">
                <div>BALANCE</div>
                <span>
                  {typeof data?.balance === "number" || typeof data?.balance === "string"
                    ? gweiToToken(data.balance, network as Network)
                    : "-"}
                </span>
              </div>
            </div>
          </div>
          <Button
            href={
              network === Network.Mainnet
                ? "http://brain.web3signer.dappnode"
                : `http://brain.web3signer-${network}.dappnode`
            }
            fullwidth
            {...newTabProps}
            variant="outline-dappnode"
          >
            <span>{data?.total < 1 ? "Import Validators" : "Manage Validators"}</span>
          </Button>
        </>
      )}
    </NetworkCard>
  );
};

export const RewardsCard = ({
  network,
  beaconExplorer,
  pubKeys
}: {
  network: string;
  beaconExplorer: { [key: string]: string };
  pubKeys?: string[];
}) => {
  // Construct dynamic Beaconcha.in dashboard URL for networks that support it (Mainnet and Hoodi)
  const getDashboardUrl = () => {
    const baseUrl = beaconExplorer.url;

    if (pubKeys && pubKeys.length > 0 && (network === Network.Mainnet || network === Network.Hoodi)) {
      return `${baseUrl}dashboard?validators=${pubKeys.join(",")}`;
    }

    return baseUrl;
  };

  const dashboardUrl = getDashboardUrl();

  return (
    <NetworkCard title="REWARDS" icon={<RewardsIcon />}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "16px" }}
      >
        View your detailed validator rewards in the explorer.
      </div>
      <Button href={dashboardUrl} fullwidth {...newTabProps} variant="outline-dappnode">
        <span>{`Visit ${beaconExplorer.name}`}</span>
      </Button>
    </NetworkCard>
  );
};

export const NoNodesCard = () => {
  return (
    <Card>
      <div className="no-nodes-card">
        <h5>No nodes configured yet!</h5>
        <div>You haven't set up a node on any network.</div>
        <div>
          Set up your nodes from the <Link to={`/${stakersPath}`}>Stakers tab</Link>.
        </div>
      </div>
    </Card>
  );
};

// Helper function to render attesting status
const renderAttestingStatus = (attesting: number, total: number) => {
  if (total === 0) {
    return <span>-</span>;
  }
  if (attesting === total) {
    return <div className="badge-status synced">Online</div>;
  }
  if (attesting === 0) {
    return <div className="badge-status offline">Offline</div>;
  }
  // Partial: some attesting, some not
  return (
    <span className="badge-status syncing">
      {attesting}/{total}
    </span>
  );
};
