import React from "react";
import SubTitle from "components/SubTitle";
import { useNetworkStats } from "hooks/useNetworkStats";
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
import { capitalize } from "utils/strings";
import { ProgressBar } from "react-bootstrap";
import "./networkStats.scss";

export default function NetworkStats() {
  const { isLoading, networkStats, clientsLoading } = useNetworkStats();
  return (
    <div className="network-stats">
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {Object.entries(networkStats).map(
            ([network, data]) =>
              data && (
                <div key={network}>
                  <SubTitle>{network.toUpperCase()}</SubTitle>
                  <div className="network-cards-container">
                    <StatusCard network={network} data={data.nodeStatus} clientsLoading={clientsLoading} />
                    <ValidatorsCard network={network} data={data.validators} />

                    <NetworkCard title="REWARDS" icon={<RewardsIcon />}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        🚧 COMING SOON 🚧
                      </div>
                    </NetworkCard>
                  </div>
                </div>
              )
          )}
        </>
      )}
    </div>
  );
}

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
      <h5>{title}</h5>
    </div>
    {children}
  </Card>
);

const StatusCard = ({
  network,
  data,
  clientsLoading
}: {
  network: string;
  data: NodeStatus | undefined;
  clientsLoading: boolean;
}) => {
  if (clientsLoading) {
    <NetworkCard title="NODE STATUS" icon={<HealthIcon />}>
      <div>data could not be fetched</div>
    </NetworkCard>;
  }

  if (!data) {
    <NetworkCard title="NODE STATUS" icon={<HealthIcon />}>
      <div>data could not be fetched</div>
    </NetworkCard>;
  }

  const navigate = useNavigate();
  const execution = data && data.ec;
  const consensus = data && data.cc;
  return (
    <NetworkCard title="NODE STATUS" icon={<HealthIcon />}>
      {clientsLoading ? (
        <Loading />
      ) : data ? (
        <div className="status-card-container">
          <div className="status-client-row">
            {execution && (
              <>
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
                {!execution.isSynced && <ProgressBar animated now={execution.progress} />}
              </>
            )}
          </div>
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

const ValidatorsCard = ({ network, data }: { network: string; data: NetworkStatus["validators"] }) => {
  return (
    <NetworkCard title="YOUR VALIDATORS" icon={<BoltIcon />}>
      <div className="validators-card-container">
        <div className="validators-row">
          <div className="network-stat-col">
            <div>TOTAL</div>
            <span>{data?.total ?? "-"}</span>
          </div>
          <div className="network-stat-col">
            <div>BALANCE</div>
            <span>{data?.balance ?? "-"}</span>
          </div>
          <div className="network-stat-col">
            <div>EFFECTIVITY</div>
            <span>{data?.efectivity ?? "-"}%</span>
          </div>
        </div>
        <hr />
        <div className="validators-row">
          <div className="network-stat-col">
            <div>ATTESTING</div>
            <span>{data?.attesting ?? "-"}</span>
          </div>
          <div className="network-stat-col">
            <div>PROPOSALS</div>
            <span>{data?.proposals ?? "-"}</span>
          </div>
        </div>
      </div>
      <Button
        href={`http://brain.web3signer-${network}.dappnode:9000`}
        fullwidth
        {...newTabProps}
        variant="outline-dappnode"
      >
        <span>View Validators</span>
      </Button>
    </NetworkCard>
  );
};
