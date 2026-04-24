import React from "react";
import { Link } from "react-router-dom";
import { useNetworkStats } from "hooks/useNetworkStats";
import { DashboardSupportedNetwork, Network } from "@dappnode/types";
import { Skeleton } from "components/primitives/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "components/primitives/empty";
import { TypographyH4 } from "components/primitives/typography";
import { ServerOff } from "lucide-react";
import { capitalize } from "utils/strings";
import { withLegacyBase } from "utils/path";
import { NodeStatusCard } from "./NodeStatusCard";
import { ValidatorsCard } from "./ValidatorsCard";
import { RewardsCard } from "./RewardsCard";

export function NetworkStatsSection() {
  const {
    networkStats,
    clientsLoading,
    getNetworkLogo,
    networksWithClients,
    isNetworkNodeLoading,
    isNetworkValidatorsLoading
  } = useNetworkStats();

  if (clientsLoading) {
    return (
      <div className="tw:space-y-4">
        <Skeleton className="tw:h-8 tw:w-40" />
        <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="tw:h-48 tw:rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!networksWithClients || networksWithClients.length === 0) {
    return (
      <Empty className="tw:border tw:py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ServerOff />
          </EmptyMedia>
          <EmptyTitle>No nodes configured yet</EmptyTitle>
          <EmptyDescription>
            You haven't set up a node on any network.{" "}
            <Link to={withLegacyBase("stakers")} className="tw:underline tw:text-primary">
              Set up your nodes from the Stakers tab.
            </Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="tw:space-y-6">
      {networksWithClients.map((network) => {
        const data = networkStats[network];
        const NetworkLogo = getNetworkLogo(network as DashboardSupportedNetwork);
        const nodeLoading = isNetworkNodeLoading(network);
        const validatorsLoading = isNetworkValidatorsLoading(network);

        return (
          <div key={network} className="tw:space-y-3">
            <div className="tw:flex tw:items-center tw:gap-2">
              <NetworkLogo width={20} height={20} />
              <TypographyH4>{network === Network.Mainnet ? "Ethereum" : capitalize(network)}</TypographyH4>
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-card">
              <NodeStatusCard
                network={network}
                data={data?.nodeStatus}
                clientsLoading={nodeLoading}
                clientsDnps={data?.clientsDnps}
              />

              {data && data.hasValidators && (
                <ValidatorsCard network={network} validatorsLoading={validatorsLoading} data={data.validators} />
              )}

              {data && data.beaconExplorer && data.validators && data.validators.total > 0 && (
                <RewardsCard network={network} beaconExplorer={data.beaconExplorer} pubKeys={data.validators.pubKeys} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
