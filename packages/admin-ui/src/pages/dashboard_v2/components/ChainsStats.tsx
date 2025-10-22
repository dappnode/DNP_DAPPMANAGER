import React from "react";
import SubTitle from "components/SubTitle";
import { useChainStats } from "hooks/useChainsStats";
import Card from "components/Card";

import Loading from "components/Loading";
import { ProgressBar } from "react-bootstrap";
import "./chainsStats.scss";
import { HealthIcon } from "./icons/HealthIcon";
import { BoltIcon } from "./icons/BoltIcon";
import { RewardsIcon } from "./icons/RewardsIcon";
import Button from "components/Button";
import { useNavigate } from "react-router";
import { basePath } from "pages/stakers";

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
                <StatusCard network={network} />
                <ChainCard title="YOUR VALIDATORS" icon={<BoltIcon />}>
                  <ProgressBar now={parseFloat(data)} label={data} />
                </ChainCard>
                <ChainCard title="REWARDS" icon={<RewardsIcon />}>
                  <ProgressBar now={parseFloat(data)} label={data} />
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

const StatusCard = ({ network }: { network: string }) => {
  const navigate = useNavigate();
  return (
    <ChainCard title="NODE STATUS" icon={<HealthIcon />}>
      <div className="status-card-container">
        <div className="status-client-row">
          <div className="status-client-name">
            <span>EXECUTION</span>
            <span>Geth</span>
          </div>
          <div className="status-client-sync">
            <span>#123456</span>
            <span>Synced</span>
          </div>
        </div>
        <hr />
        <div className="status-client-row">
          <div className="status-client-name">
            <span>CONSENSUS</span>
            <span>Lodestar</span>
          </div>
          <div className="status-client-sync">
            <span>#123456</span>
            <span>Synced</span>
          </div>
        </div>
      </div>
      <Button onClick={() => navigate("/" + basePath + `/${network}`)} fullwidth>
        <span>View Setup</span>
      </Button>
    </ChainCard>
  );
};
