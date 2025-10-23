import React from "react";
import SubTitle from "components/SubTitle";
import { NetworkStatus, NodeStatus, useChainStats } from "hooks/useChainsStats";
import Card from "components/Card";

import Loading from "components/Loading";
// import { ProgressBar } from "react-bootstrap";
import "./chainsStats.scss";
import { HealthIcon } from "./icons/HealthIcon";
import { BoltIcon } from "./icons/BoltIcon";
import { RewardsIcon } from "./icons/RewardsIcon";
import Button from "components/Button";
import { useNavigate } from "react-router";
import { basePath } from "pages/stakers";
import newTabProps from "utils/newTabProps";
import { Network } from "@dappnode/types";

export default function ChainStats() {
  const { isLoading, chainStats } = useChainStats();
  return (
    <div className="chain-stats">
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {Object.entries(chainStats).map(([network, data]) => (
            <div key={network}>
              <SubTitle>{network.toUpperCase()}</SubTitle>
              <div className="chain-cards-container">
                <StatusCard network={network} data={data.nodeStatus} />
                <ValidatorsCard network={network} data={data.validators} />

                <ChainCard title="REWARDS" icon={<RewardsIcon />}>
                  <div>Rewards card</div>
                </ChainCard>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const ChainCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <Card className="chain-stats-card">
    <div className="chain-card-header">
      <div className="chain-card-icon">{icon}</div>
      <h5>{title}</h5>
    </div>
    {children}
  </Card>
);

const StatusCard = ({ network, data }: { network: string; data: NodeStatus }) => {
  const navigate = useNavigate();
  const execution = data.execution;
  const consensus = data.consensus;
  return (
    <ChainCard title="NODE STATUS" icon={<HealthIcon />}>
      <div className="status-card-container">
        <div className="status-client-row">
          {execution && (
            <>
              <div className="chain-stat-col">
                <div>EXECUTION</div>
                <span>
                  {execution.name} {execution.version}
                </span>
              </div>
              <div className="chain-stat-col">
                <div>#{execution.blockNumber}</div>
                <div className="client-status">{execution.status}</div>
              </div>
            </>
          )}
        </div>
        <hr />
        <div className="status-client-row">
          {consensus && (
            <>
              <div className="chain-stat-col">
                <div>CONSENSUS</div>
                <span>
                  {consensus.name} {consensus.version}
                </span>
              </div>
              <div className="chain-stat-col">
                <div>#{consensus.blockNumber}</div>
                <div className="client-status">{consensus.status}</div>
              </div>
            </>
          )}
        </div>
      </div>
      <Button
        onClick={() => navigate("/" + basePath + `/${network === Network.Mainnet ? "ethereum" : network}`)}
        fullwidth
        variant="outline-dappnode"
      >
        <span>View Setup</span>
      </Button>
    </ChainCard>
  );
};

const ValidatorsCard = ({ network, data }: { network: string; data: NetworkStatus["validators"] }) => {
  return (
    <ChainCard title="YOUR VALIDATORS" icon={<BoltIcon />}>
      <div className="validators-card-container">
        <div className="validators-row">
          <div className="chain-stat-col">
            <div>TOTAL</div>
            <span>{data?.total ?? "-"}</span>
          </div>
          <div className="chain-stat-col">
            <div>BALANCE</div>
            <span>{data?.balance ?? "-"}</span>
          </div>
          <div className="chain-stat-col">
            <div>EFFECTIVITY</div>
            <span>{data?.efectivity ?? "-"}%</span>
          </div>
        </div>
        <hr />
        <div className="validators-row">
          <div className="chain-stat-col">
            <div>ATTESTING</div>
            <span>{data?.attesting ?? "-"}</span>
          </div>
          <div className="chain-stat-col">
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
    </ChainCard>
  );
};
