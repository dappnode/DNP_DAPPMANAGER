import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "components/primitives/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "components/primitives/tooltip";
import { Info } from "lucide-react";
import { capitalize } from "utils/strings";
import { withLegacyBase } from "utils/path";

export function ClientRow({
  label,
  network: _network,
  dnpName,
  clientData,
  clientError,
  isInstalled,
  showWaiting = false,
  showProgress = false,
  progress
}: {
  label: string;
  network: string;
  dnpName: string | null;
  clientData: { name: string; isSynced: boolean; currentBlock: number; peers: number; progress: number } | null;
  clientError: { error: string } | null;
  isInstalled: boolean;
  showWaiting?: boolean;
  showProgress?: boolean;
  progress?: number;
}) {
  const parseClientName = (name: string) => capitalize(name.split(".")[0].split("-")[0] ?? "-");

  const clientLink = dnpName ? (
    <Link
      to={withLegacyBase(`packages/my/${dnpName}/info`)}
      className="tw:underline tw:underline-offset-2 tw:text-primary"
    >
      {clientData ? capitalize(clientData.name ?? "-") : parseClientName(dnpName)}
    </Link>
  ) : clientData ? (
    capitalize(clientData.name ?? "-")
  ) : (
    "-"
  );

  if (!isInstalled) {
    return (
      <div className="tw:flex tw:items-center tw:justify-between">
        <div className="tw:text-xs tw:text-muted-foreground">{label}</div>
        <Badge variant="secondary">Not installed</Badge>
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="tw:flex tw:items-center tw:justify-between">
        <div>
          <div className="tw:text-xs tw:text-muted-foreground">{label}</div>
          <div className="tw:text-sm">{clientLink}</div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="tw:flex tw:items-center tw:gap-1">
                <Info className="tw:size-3.5 tw:text-muted-foreground" />
                <Badge variant="destructive">Error</Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>{clientError.error}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (clientData) {
    return (
      <div className="tw:space-y-1.5">
        <div className="tw:flex tw:items-center tw:justify-between">
          <div>
            <div className="tw:text-xs tw:text-muted-foreground">{label}</div>
            <div className="tw:text-sm">{clientLink}</div>
          </div>
          <div className="tw:flex tw:items-center tw:gap-3 tw:text-xs">
            <span className="tw:text-muted-foreground">Peers: {clientData.peers}</span>
            {showWaiting ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <Info className="tw:size-3.5 tw:text-muted-foreground" />
                      <Badge variant="caution">Waiting</Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {label} client status will be available once the consensus client finishes syncing.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <>
                <span className="tw:text-muted-foreground">#{clientData.currentBlock}</span>
                <Badge variant={clientData.isSynced ? "success" : "caution"}>
                  {clientData.isSynced ? "Synced" : "Syncing"}
                </Badge>
              </>
            )}
          </div>
        </div>
        {showProgress && progress !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="tw:relative tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-muted">
                  <div
                    className="tw:h-full tw:rounded-full tw:bg-primary tw:transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Syncing progress: {progress}%</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return null;
}
