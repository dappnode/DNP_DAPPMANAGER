import React from "react";
import SubTitle from "components/SubTitle";
import { useNetworkStats } from "hooks/useNetworkStats";
import Loading from "components/Loading";
import { RewardsCard, StatusCard, ValidatorsCard } from "./NetworkCards";
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
                    <RewardsCard />
                  </div>
                </div>
              )
          )}
        </>
      )}
    </div>
  );
}
