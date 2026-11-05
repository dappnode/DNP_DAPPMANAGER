import React from "react";
import SubTitle from "components/SubTitle";
import { useNetworkStats } from "hooks/useNetworkStats";
import { NoNodesCard, RewardsCard, StatusCard, ValidatorsCard } from "./NetworkCards";
import { DashboardSupportedNetwork, Network } from "@dappnode/types";
import Loading from "components/Loading";
import "./networkStats.scss";

export default function NetworkStats() {
  const {
    networkStats,
    clientsLoading,
    getNetworkLogo,
    networksWithClients,
    isNetworkNodeLoading,
    isNetworkValidatorsLoading
  } = useNetworkStats();

  // Show global spinner only during the initial discovery phase
  // (fetching client lists + installed packages)
  if (clientsLoading) {
    return (
      <div className="network-stats">
        <Loading />
      </div>
    );
  }

  // After discovery: if no networks have clients, show the empty state
  if (!networksWithClients || networksWithClients.length === 0) {
    return (
      <div className="network-stats">
        <NoNodesCard />
      </div>
    );
  }

  return (
    <div className="network-stats">
      {networksWithClients.map((network) => {
        const data = networkStats[network];
        const NetworkLogo = getNetworkLogo(network as DashboardSupportedNetwork);
        const nodeLoading = isNetworkNodeLoading(network);
        const validatorsLoading = isNetworkValidatorsLoading(network);

        return (
          <div key={network}>
            <div className="network-header">
              <NetworkLogo width={24} height={24} />
              <SubTitle>{(network === Network.Mainnet ? "ethereum" : network).toUpperCase()}</SubTitle>
            </div>

            <div className="network-cards-container">
              <StatusCard
                network={network}
                data={data?.nodeStatus}
                clientsLoading={nodeLoading}
                clientsDnps={data?.clientsDnps}
              />

              {data && data.hasValidators && (
                <ValidatorsCard network={network} validatorsLoading={validatorsLoading} data={data.validators} />
              )}

              {data && data.beaconExplorer && data.validators && data.validators.total > 0 && (
                <RewardsCard
                  network={network}
                  beaconExplorer={data.beaconExplorer}
                  pubKeys={data.validators.pubKeys}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
