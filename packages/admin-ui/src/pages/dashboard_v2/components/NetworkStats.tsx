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
    validatorsLoading,
    rewardsLoading,
    beaconchaConsentSet
  } = useNetworkStats();
  return (
    <div className="network-stats">
      {clientsLoading ? (
        <Loading />
      ) : Object.entries(networkStats).length === 0 ? (
        <NoNodesCard />
      ) : (
        <>
          {Object.entries(networkStats).map(([network, data]) => {
            if (!data) return null;
            const NetworkLogo = getNetworkLogo(network as DashboardSupportedNetwork);
            return (
              <div key={network}>
                <div className="network-header">
                  <NetworkLogo width={24} height={24} />
                  <SubTitle>{(network === Network.Mainnet ? "ethereum" : network).toUpperCase()}</SubTitle>
                </div>

                <div className="network-cards-container">
                  <StatusCard network={network} data={data.nodeStatus} clientsLoading={clientsLoading} />

                  {data.hasValidators && (
                    <ValidatorsCard
                      network={network}
                      validatorsLoading={validatorsLoading}
                      data={data.validators}
                      hasRewardsData={data.hasRewardsData || false}
                      efectivity={data.rewards?.efectivity}
                      proposals={data.rewards?.proposals}
                    />
                  )}

                  {data.hasRewardsData && (
                    <RewardsCard
                      network={network}
                      data={data.rewards}
                      loading={rewardsLoading}
                      beaconchaConsentSet={beaconchaConsentSet}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
