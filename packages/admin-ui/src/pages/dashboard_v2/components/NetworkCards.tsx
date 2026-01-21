import React from "react";
import Card from "components/Card";
import Loading from "components/Loading";
// import { ProgressBar } from "react-bootstrap";
import { HealthIcon } from "./icons/HealthIcon";
import { BoltIcon } from "./icons/BoltIcon";
import { RewardsIcon } from "./icons/RewardsIcon";
import Button from "components/Button";
import { useNavigate } from "react-router";
import { basePath } from "pages/stakers";
import newTabProps from "utils/newTabProps";
import { Network, NetworkStatus, NodeStatus } from "@dappnode/types";
import { gweiToToken } from "utils/gweiToToken";
import { capitalize } from "utils/strings";
import { OverlayTrigger, ProgressBar, Tooltip } from "react-bootstrap";
import { MdWarningAmber } from "react-icons/md";

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
  clientsLoading
}: {
  network: string;
  data: NodeStatus | undefined;
  clientsLoading: boolean;
}) => {
  const navigate = useNavigate();
  const execution = data && data.ec;
  const consensus = data && data.cc;
  return (
    <NetworkCard title="NODE STATUS" icon={<HealthIcon />}>
      {clientsLoading ? (
        <Loading small />
      ) : data ? (
        <div className="status-card-container">
          {execution && (
            <div>
              <div className="status-client-row">
                <div className="network-stat-col">
                  <div>EXECUTION</div>
                  <span>{capitalize(execution.name ?? "-")}</span>
                </div>
                <div className="status-client-details">
                  <div className="network-stat-col">
                    <div>PEERS</div>
                    <span>{execution.peers}</span>
                  </div>
                  <div className="network-stat-col">
                    <div>#{execution.currentBlock}</div>
                    <div className={`client-status ${execution.isSynced ? "synced" : "syncing"}`}>
                      {execution.isSynced ? "synced" : "syncing"}
                    </div>
                  </div>
                </div>
              </div>
              {!execution.isSynced && <ProgressBar animated now={execution.progress} />}
            </div>
          )}
          <hr />
          {consensus && (
            <div>
              <div className="status-client-row">
                <>
                  <div className="network-stat-col">
                    <div>CONSENSUS</div>
                    <span>{capitalize(consensus.name ?? "-")}</span>
                  </div>
                  <div className="status-client-details">
                    <div className="network-stat-col">
                      <div>PEERS</div>
                      <span>{consensus.peers}</span>
                    </div>
                    <div className="network-stat-col">
                      <div>#{consensus.currentBlock}</div>
                      <div className={`client-status ${consensus.isSynced ? "synced" : "syncing"}`}>
                        {consensus.isSynced ? "synced" : "syncing"}
                      </div>
                    </div>
                  </div>
                </>
              </div>
              {!consensus.isSynced && <ProgressBar animated now={consensus.progress} />}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>Data could not be fetched</div>
      )}

      <Button
        onClick={() => navigate("/" + basePath + `/${network === Network.Mainnet ? "ethereum" : network}`)}
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
  data,
  hasRewardsData,
  efectivity,
  proposals
}: {
  network: string;
  validatorsLoading: boolean;
  data: NetworkStatus["validators"];
  hasRewardsData: boolean;
  efectivity: number | undefined;
  proposals: number | undefined;
}) => {
  return (
    <NetworkCard title="YOUR VALIDATORS" icon={<BoltIcon />}>
      {validatorsLoading ? (
        <Loading small />
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
                <div>ATTESTING</div>
                <span>{data?.attesting ?? "-"}</span>
              </div>
              {hasRewardsData && (
                <div className="network-stat-col">
                  <div>EFFECTIVITY</div>
                  <span>{efectivity ?? "-"}%</span>
                </div>
              )}
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

              {hasRewardsData && (
                <div className="network-stat-col">
                  <div>PROPOSALS</div>
                  <span>{proposals ?? "-"}</span>
                </div>
              )}
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
            <span>View Validators</span>
          </Button>
        </>
      )}
    </NetworkCard>
  );
};

export const RewardsCard = () => {
  return (
    <NetworkCard title="REWARDS" icon={<RewardsIcon />}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "16px" }}
      >
        🚧 COMING SOON 🚧
      </div>
    </NetworkCard>
  );
};
