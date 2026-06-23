import React from "react";
import { SpecialPermissionAllDnps } from "@dappnode/types";
import { prettyDnpName } from "utils/format";
import RenderMarkdown from "components/RenderMarkdown";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { CheckCircle, ShieldAlert, ArrowLeft } from "lucide-react";

interface InstallerPermissionsStepProps {
  permissions: SpecialPermissionAllDnps;
  onAccept: () => void;
  goBack: () => void;
}

/**
 * Permissions step — lists special permissions requested by each
 * package in the dependency tree.
 */
export function InstallerPermissionsStep({ permissions, onAccept, goBack }: InstallerPermissionsStepProps) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-card">
      <div>
        <h2 className="tw:text-xl tw:font-semibold tw:text-foreground">Special Permissions</h2>
        <p className="tw:text-sm tw:text-muted-foreground tw:mt-1">
          Review the special permissions required by this package.
        </p>
      </div>

      {Object.entries(permissions).map(([dnpName, permissionsDnp]) => (
        <Card key={dnpName}>
          <CardContent className="tw:flex tw:flex-col tw:gap-3">
            <div className="tw:flex tw:items-center tw:gap-2">
              <ShieldAlert className="tw:size-4 tw:text-caution" />
              <span className="tw:text-sm tw:font-semibold tw:text-foreground">{prettyDnpName(dnpName)}</span>
            </div>

            {permissionsDnp.length === 0 ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-success">
                <CheckCircle className="tw:size-3.5" />
                Requires no special permissions
              </div>
            ) : (
              <div className="tw:flex tw:flex-col tw:gap-2">
                {permissionsDnp.map(({ name, details }) => (
                  <div key={name} className="tw:rounded-lg tw:border tw:border-border tw:bg-muted/30 tw:p-3">
                    <Badge variant="caution" className="tw:mb-1.5">
                      {name}
                    </Badge>
                    <div className="tw:text-sm tw:text-muted-foreground">
                      <RenderMarkdown source={details} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Navigation buttons */}
      <div className="tw:flex tw:items-center tw:justify-between tw:pt-2">
        <Button variant="ghost" onClick={goBack} className="tw:gap-1.5">
          <ArrowLeft className="tw:size-4" />
          Back
        </Button>
        <Button onClick={onAccept}>Accept &amp; Continue</Button>
      </div>
    </div>
  );
}
