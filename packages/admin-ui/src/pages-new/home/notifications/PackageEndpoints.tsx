import React, { useCallback, useEffect, useRef, useState } from "react";
import { GatusEndpoint, CustomEndpoint } from "@dappnode/types";
import { Card, CardContent, CardHeader, CardTitle } from "components/primitives/card";
import { Switch } from "components/primitives/switch";
import { Badge } from "components/primitives/badge";
import { Separator } from "components/primitives/separator";
import { prettyDnpName } from "utils/format";
import { api, useApi } from "api";
import { toast } from "sonner";
import { GatusEndpointRow, CustomEndpointRow } from "./EndpointRow";

interface PackageEndpointsProps {
  dnpName: string;
  gatusEndpoints: GatusEndpoint[];
  customEndpoints: CustomEndpoint[];
  isCore: boolean;
}

export function PackageEndpoints({ dnpName, gatusEndpoints, customEndpoints, isCore }: PackageEndpointsProps) {
  const [endpointsGatus, setEndpointsGatus] = useState([...gatusEndpoints]);
  const [endpointsCustom, setEndpointsCustom] = useState([...customEndpoints]);
  const [pkgEnabled, setPkgEnabled] = useState(
    gatusEndpoints.some((ep) => ep.enabled) || customEndpoints.some((ep) => ep.enabled)
  );
  const isUserAction = useRef(false);

  // Check if package is running
  const dnpCall = useApi.packageGet({ dnpName });
  const allStopped = dnpCall.data?.containers.every((c) => c.state !== "running") ?? false;

  // Sync with props
  useEffect(() => {
    setEndpointsGatus([...gatusEndpoints]);
    setEndpointsCustom([...customEndpoints]);
    setPkgEnabled(gatusEndpoints.some((ep) => ep.enabled) || customEndpoints.some((ep) => ep.enabled));
  }, [gatusEndpoints, customEndpoints]);

  // Toggle all endpoints for this package
  const handlePkgToggle = useCallback(() => {
    const next = !pkgEnabled;
    isUserAction.current = true;
    setEndpointsGatus((prev) => prev.map((ep) => ({ ...ep, enabled: next })));
    setEndpointsCustom((prev) => prev.map((ep) => ({ ...ep, enabled: next })));
    setPkgEnabled(next);
  }, [pkgEnabled]);

  // Wrap setters so any child toggle marks as user action
  const setGatusWithFlag = useCallback((updater: (prev: GatusEndpoint[]) => GatusEndpoint[]) => {
    isUserAction.current = true;
    setEndpointsGatus(updater);
  }, []);

  const setCustomWithFlag = useCallback((updater: (prev: CustomEndpoint[]) => CustomEndpoint[]) => {
    isUserAction.current = true;
    PackageEndpoints;
    setEndpointsCustom(updater);
  }, []);

  // Persist changes when user modifies endpoints
  useEffect(() => {
    if (!isUserAction.current) return;
    isUserAction.current = false;

    const prettyName = prettyDnpName(dnpName);

    api
      .notificationsUpdateEndpoints({
        dnpName,
        isCore,
        notificationsConfig: {
          endpoints: endpointsGatus.length > 0 ? endpointsGatus : undefined,
          customEndpoints: endpointsCustom.length > 0 ? endpointsCustom : undefined
        }
      })
      .then(() => toast.success(`${prettyName} settings updated`))
      .catch(() => toast.error(`Error updating settings for ${prettyName}`));
  }, [endpointsGatus, endpointsCustom, dnpName, isCore]);

  const totalEndpoints = endpointsGatus.length + endpointsCustom.length;

  return (
    <Card>
      <CardHeader className="tw:flex tw:flex-row tw:items-center tw:justify-between tw:gap-4">
        <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
          <CardTitle className="tw:truncate">{prettyDnpName(dnpName)}</CardTitle>
          {allStopped && (
            <Badge variant="caution" className="tw:shrink-0">
              Not running
            </Badge>
          )}
        </div>
        <Switch checked={pkgEnabled} onCheckedChange={handlePkgToggle} />
      </CardHeader>
      <Separator />

      {pkgEnabled && totalEndpoints > 0 && (
        <CardContent className="tw:space-y-4">
          {endpointsGatus.map((ep, i) => (
            <React.Fragment key={ep.name}>
              {i > 0 && <Separator />}
              <GatusEndpointRow endpoint={ep} index={i} setEndpoints={setGatusWithFlag} />
            </React.Fragment>
          ))}

          {endpointsCustom.map((ep, i) => (
            <React.Fragment key={ep.name}>
              {(i > 0 || endpointsGatus.length > 0) && <Separator />}
              <CustomEndpointRow endpoint={ep} index={i} setEndpoints={setCustomWithFlag} />
            </React.Fragment>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
