import React from "react";
import { PackageContainer } from "@dappnode/types";
import { Card, CardContent, CardHeader, CardTitle } from "components/primitives/card";
import { Badge } from "components/primitives/badge";
import { Network as NetworkIcon } from "lucide-react";

export function ContainerIpsCard({ container }: { container: PackageContainer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:flex tw:items-center tw:gap-2">
          <NetworkIcon className="tw:size-4" />
          Container IPs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!container.ip && !container.privateIp ? (
          <p className="tw:text-sm tw:text-muted-foreground">Container IPs not available</p>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-2 tw:text-sm">
            {container.ip && (
              <div className="tw:flex tw:items-center tw:gap-2">
                <Badge variant="outline" className="tw:text-xs">
                  Public
                </Badge>
                <span className="tw:font-mono tw:text-xs">{container.ip}</span>
              </div>
            )}
            {container.privateIp && (
              <div className="tw:flex tw:items-center tw:gap-2">
                <Badge variant="outline" className="tw:text-xs">
                  Private
                </Badge>
                <span className="tw:font-mono tw:text-xs">{container.privateIp}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
