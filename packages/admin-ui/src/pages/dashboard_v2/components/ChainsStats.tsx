import React from "react";
import SubTitle from "components/SubTitle";
import { useChainStats } from "hooks/useChainsStats";
import Card from "components/Card";

import Loading from "components/Loading";
import { ProgressBar } from "react-bootstrap";
import "./chainsStats.scss";

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
                <Card className="chain-stats-card">
                  <h5>NODE STATUS</h5>
                  <ProgressBar now={parseFloat(data)} label={data} />
                </Card>
                <Card className="chain-stats-card">
                  <h5>YOUR VALIDATORS</h5>
                  <ProgressBar now={parseFloat(data)} label={data} />
                </Card>
                <Card className="chain-stats-card">
                  <h5>REWARDS</h5>
                  <ProgressBar now={parseFloat(data)} label={data} />
                </Card>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
