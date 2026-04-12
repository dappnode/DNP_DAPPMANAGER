import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { prettyDnpName } from "utils/format";
import { getCoreUpdateAvailable, getCoreRequestStatus, getCoreUpdateData } from "services/coreUpdate/selectors";
import { updateCore } from "services/coreUpdate/actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Skeleton } from "components/primitives/skeleton";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export function SystemUpdateSection() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(getCoreRequestStatus);
  const coreUpdateAvailable = useSelector(getCoreUpdateAvailable);
  const coreUpdateData = useSelector(getCoreUpdateData);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">System Update</CardTitle>
        </CardHeader>
        <CardContent className="tw:space-y-3">
          <Skeleton className="tw:h-4 tw:w-3/4" />
          <Skeleton className="tw:h-4 tw:w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">System Update</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-destructive">
            <AlertTriangle className="tw:size-4" />
            <span className="tw:text-sm">Error checking core version: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!coreUpdateAvailable || !coreUpdateData || !coreUpdateData.available) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">System Update</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-green-600">
            <CheckCircle2 className="tw:size-4" />
            <span className="tw:text-sm tw:font-medium">System is up to date</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { changelog, updateAlerts, packages: corePackages } = coreUpdateData;
  const coreDeps = corePackages.filter((dnp) => !(dnp.name || "").includes("core"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">System Update Available</CardTitle>
        <CardDescription>A new version of Dappnode core is available.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        {changelog && (
          <div className="tw:rounded-lg tw:bg-muted tw:p-3 tw:text-sm tw:max-h-48 tw:overflow-y-auto">
            <pre className="tw:whitespace-pre-wrap tw:font-sans">{changelog}</pre>
          </div>
        )}

        {updateAlerts.map(({ from, to, message }) => (
          <div
            key={from + to}
            className="tw:rounded-lg tw:border tw:border-yellow-500/30 tw:bg-yellow-50 tw:dark:bg-yellow-900/10 tw:p-3"
          >
            {updateAlerts.length > 1 && (
              <div className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-semibold tw:mb-1">
                <span>{from}</span>
                <ArrowRight className="tw:size-3" />
                <span>{to}</span>
              </div>
            )}
            <p className="tw:text-sm">{message}</p>
          </div>
        ))}

        {coreDeps.length > 0 && (
          <div className="tw:space-y-1">
            <p className="tw:text-xs tw:font-medium tw:text-muted-foreground tw:uppercase">Packages to update</p>
            {coreDeps.map((dep) => (
              <div key={dep.name} className="tw:flex tw:items-center tw:justify-between tw:text-sm">
                <span>{prettyDnpName(dep.name)}</span>
                <span className="tw:text-muted-foreground">{dep.to}</span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={() => dispatch(updateCore())}>Update System</Button>
      </CardContent>
    </Card>
  );
}
