import React from "react";
import { useNavigate } from "react-router-dom";
import { isClientError } from "hooks/useNetworkStats";
import { Network, NodeStatus } from "@dappnode/types";
import { Card, CardHeader, CardTitle, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Skeleton } from "components/primitives/skeleton";
import { Separator } from "components/primitives/separator";
import { Activity } from "lucide-react";
import { ClientRow } from "./ClientRow";

export function NodeStatusCard({
  network,
  data,
  clientsLoading,
  clientsDnps
}: {
  network: string;
  data: NodeStatus | undefined;
  clientsLoading: boolean;
  clientsDnps?: { ecDnp: string | null; ccDnp: string | null };
}) {
  const navigate = useNavigate();

  const ecResult = data?.ec ?? null;
  const ccResult = data?.cc ?? null;
  const ecError = ecResult && isClientError(ecResult) ? ecResult : null;
  const ccError = ccResult && isClientError(ccResult) ? ccResult : null;
  const execution = ecResult && !isClientError(ecResult) ? ecResult : null;
  const consensus = ccResult && !isClientError(ccResult) ? ccResult : null;
  const consensusSynced = consensus?.isSynced ?? false;

  return (
    <Card>
      <CardHeader className="tw:border-b">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Activity className="tw:size-4 tw:text-muted-foreground" />
          <CardTitle>Node Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-3 tw:flex-1">
        {clientsLoading ? (
          <div className="tw:space-y-3">
            <Skeleton className="tw:h-10 tw:w-full" />
            <Skeleton className="tw:h-10 tw:w-full" />
          </div>
        ) : data ? (
          <>
            <ClientRow
              label="Execution"
              network={network}
              dnpName={clientsDnps?.ecDnp ?? null}
              clientData={execution}
              clientError={ecError}
              isInstalled={ecResult !== null}
              showWaiting={!consensusSynced && !!execution}
              showProgress={consensusSynced && !!execution && !execution.isSynced}
              progress={execution?.progress}
            />
            <Separator />
            <ClientRow
              label="Consensus"
              network={network}
              dnpName={clientsDnps?.ccDnp ?? null}
              clientData={consensus}
              clientError={ccError}
              isInstalled={ccResult !== null}
              showProgress={!!consensus && !consensus.isSynced}
              progress={consensus?.progress}
            />
          </>
        ) : (
          <p className="tw:text-sm tw:text-muted-foreground tw:text-center tw:py-4">Data could not be fetched</p>
        )}
      </CardContent>
      <CardContent>
        <Button
          variant="outline"
          className="tw:w-full"
          onClick={() => navigate(`/staking/stakers/${network === Network.Mainnet ? "ethereum" : network}`)}
        >
          View Setup
        </Button>
      </CardContent>
    </Card>
  );
}
