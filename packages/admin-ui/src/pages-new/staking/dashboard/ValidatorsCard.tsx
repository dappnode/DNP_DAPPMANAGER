import React from "react";
import { useNavigate } from "react-router-dom";
import { Network, NetworkStatus } from "@dappnode/types";
import { Card, CardHeader, CardTitle, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { Skeleton } from "components/primitives/skeleton";
import { Separator } from "components/primitives/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "components/primitives/tooltip";
import { Zap, AlertTriangle, ExternalLink } from "lucide-react";
import { capitalize } from "utils/strings";
import { gweiToToken } from "utils/gweiToToken";
import newTabProps from "utils/newTabProps";
import { withLegacyBase } from "utils/path";

export function ValidatorsCard({
  network,
  validatorsLoading,
  data
}: {
  network: string;
  validatorsLoading: boolean;
  data: NetworkStatus["validators"];
}) {
  const navigate = useNavigate();
  const signerInstalled = data?.signerStatus.isInstalled;
  const brainRunning = data?.signerStatus.brainRunning;

  const brainUrl =
    network === Network.Mainnet ? "http://brain.web3signer.dappnode" : `http://brain.web3signer-${network}.dappnode`;

  return (
    <Card>
      <CardHeader className="tw:border-b">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Zap className="tw:size-4 tw:text-muted-foreground" />
          <CardTitle>Your Validators</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-3 tw:flex-1">
        {validatorsLoading ? (
          <div className="tw:space-y-3">
            <Skeleton className="tw:h-10 tw:w-full" />
            <Skeleton className="tw:h-10 tw:w-full" />
          </div>
        ) : !signerInstalled || !brainRunning ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:py-4 tw:text-center">
            <AlertTriangle className="tw:size-6 tw:text-caution" />
            <p className="tw:text-sm tw:text-muted-foreground">
              {!signerInstalled
                ? "Web3Signer is not installed on this network."
                : "Web3Signer is not running properly on this network."}
            </p>
            <p className="tw:text-xs tw:text-muted-foreground">
              Select Web3Signer in the stakers tab and apply changes.
            </p>
          </div>
        ) : (
          <>
            <div className="tw:flex tw:items-center tw:justify-between">
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <span className="tw:text-xs tw:text-muted-foreground">Total</span>
                {data?.beaconError && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="tw:size-3.5 tw:text-caution" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Error fetching {capitalize(network)} validators status. All keystores imported in your{" "}
                        {capitalize(network)} Web3Signer are being considered as active validators.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <span className="tw:text-sm tw:font-medium">{data?.total ?? "0"}</span>
            </div>

            <div className="tw:flex tw:items-center tw:justify-between">
              <span className="tw:text-xs tw:text-muted-foreground">Status</span>
              <AttestingBadge attesting={data?.attesting ?? 0} total={data?.total ?? 0} />
            </div>

            <Separator />

            <div className="tw:flex tw:items-center tw:justify-between">
              <span className="tw:text-xs tw:text-muted-foreground">Balance</span>
              <span className="tw:text-sm tw:font-medium">
                {typeof data?.balance === "number" || typeof data?.balance === "string"
                  ? gweiToToken(data.balance, network as Network)
                  : "-"}
              </span>
            </div>
          </>
        )}
      </CardContent>
      <CardContent>
        {!signerInstalled || !brainRunning ? (
          <Button
            variant="outline"
            className="tw:w-full"
            onClick={() => navigate(withLegacyBase(`stakers/${network === Network.Mainnet ? "ethereum" : network}`))}
          >
            Set Web3Signer
          </Button>
        ) : (
          <Button variant="outline" className="tw:w-full" asChild>
            <a href={brainUrl} {...newTabProps}>
              {(data?.total ?? 0) < 1 ? "Import Validators" : "Manage Validators"}
              <ExternalLink className="tw:ml-1 tw:size-3" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AttestingBadge({ attesting, total }: { attesting: number; total: number }) {
  if (total === 0) return <span className="tw:text-sm">-</span>;
  if (attesting === total) return <Badge variant="success">Online</Badge>;
  if (attesting === 0) return <Badge variant="destructive">Offline</Badge>;
  return (
    <Badge variant="caution">
      {attesting}/{total}
    </Badge>
  );
}
