import React from "react";
import { Network } from "@dappnode/types";
import { Card, CardHeader, CardTitle, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Trophy, ExternalLink } from "lucide-react";
import newTabProps from "utils/newTabProps";

export function RewardsCard({
  network,
  beaconExplorer,
  pubKeys
}: {
  network: string;
  beaconExplorer: { url: string; name: string };
  pubKeys?: string[];
}) {
  const getDashboardUrl = () => {
    const baseUrl = beaconExplorer.url;
    if (pubKeys && pubKeys.length > 0 && (network === Network.Mainnet || network === Network.Hoodi)) {
      return `${baseUrl}dashboard?validators=${pubKeys.join(",")}`;
    }
    return baseUrl;
  };

  return (
    <Card>
      <CardHeader className="tw:border-b">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Trophy className="tw:size-4 tw:text-muted-foreground" />
          <CardTitle>Rewards</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:py-6">
        <p className="tw:text-sm tw:text-muted-foreground tw:text-center">
          View your detailed validator rewards in the explorer.
        </p>
      </CardContent>
      <CardContent>
        <Button variant="outline" className="tw:w-full" asChild>
          <a href={getDashboardUrl()} {...newTabProps}>
            Visit {beaconExplorer.name}
            <ExternalLink className="tw:ml-1 tw:size-3" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
