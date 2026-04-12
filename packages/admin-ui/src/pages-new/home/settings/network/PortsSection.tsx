import React, { useState } from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { prettyDnpName } from "utils/format";
import { ApiTablePortStatus, UpnpTablePortStatus } from "@dappnode/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Label } from "components/primitives/label";
import { Switch } from "components/primitives/switch";
import { Badge } from "components/primitives/badge";
import { CheckCircle2, XCircle, Loader2, Globe, Wifi } from "lucide-react";

export function PortsSection() {
  const systemInfo = useApi.systemInfoGet();
  const portsToOpen = useApi.portsToOpenGet();
  const natRenewalStatus = useApi.natRenewalIsEnabled();
  const [apiReqStatus, setApiReqStatus] = useState<{
    loading?: boolean;
    result?: ApiTablePortStatus[];
    error?: unknown;
  }>({});
  const [upnpReqStatus, setUpnpReqStatus] = useState<{
    loading?: boolean;
    result?: UpnpTablePortStatus[];
    error?: unknown;
  }>({});

  async function apiStatusGet() {
    if (!portsToOpen.data) return;
    try {
      setApiReqStatus({ loading: true });
      const apiPorts = await api.portsApiStatusGet({ portsToOpen: portsToOpen.data });
      setApiReqStatus({ result: apiPorts });
    } catch (e) {
      setApiReqStatus({ error: e });
    }
  }

  async function upnpStatusGet() {
    if (!portsToOpen.data) return;
    try {
      setUpnpReqStatus({ loading: true });
      const upnpPorts = await api.portsUpnpStatusGet({ portsToOpen: portsToOpen.data });
      setUpnpReqStatus({ result: upnpPorts });
    } catch (e) {
      setUpnpReqStatus({ error: e });
    }
  }

  async function onUpnpSwitchToggle(checked: boolean) {
    try {
      toast.loading("Refreshing UPnP port mapping...");
      await api.natRenewalEnable({ enableNatRenewal: checked });
      toast.success("Successfully updated UPnP setting");
      natRenewalStatus.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const isUpnpEnabled = systemInfo.data?.upnpAvailable ?? false;
  const ports = portsToOpen.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Ports</CardTitle>
        <CardDescription>Monitor and manage network ports required by Dappnode.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        {systemInfo.data && (
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm">
            {systemInfo.data.publicIp !== systemInfo.data.internalIp ? (
              isUpnpEnabled ? (
                <>
                  <CheckCircle2 className="tw:size-4 tw:text-green-500" />
                  <span>UPnP is enabled</span>
                </>
              ) : (
                <>
                  <XCircle className="tw:size-4 tw:text-destructive" />
                  <span>UPnP is disabled — open ports manually or enable UPnP on your router</span>
                </>
              )
            ) : (
              <>
                <CheckCircle2 className="tw:size-4 tw:text-green-500" />
                <span>Public and local IPs match — no port forwarding needed</span>
              </>
            )}
          </div>
        )}

        {/* NAT Renewal toggle */}
        {natRenewalStatus.data !== undefined && (
          <div className="tw:flex tw:items-center tw:justify-between">
            <Label htmlFor="nat-renewal">NAT Renewal (UPnP auto-mapping)</Label>
            <Switch id="nat-renewal" checked={natRenewalStatus.data} onCheckedChange={onUpnpSwitchToggle} />
          </div>
        )}

        <div className="tw:flex tw:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={apiStatusGet}
            disabled={apiReqStatus.loading || ports.length === 0}
          >
            {apiReqStatus.loading ? (
              <Loader2 className="tw:size-3.5 tw:animate-spin" />
            ) : (
              <Globe className="tw:size-3.5" />
            )}
            Scan API ports
          </Button>
          {isUpnpEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={upnpStatusGet}
              disabled={upnpReqStatus.loading || ports.length === 0}
            >
              {upnpReqStatus.loading ? (
                <Loader2 className="tw:size-3.5 tw:animate-spin" />
              ) : (
                <Wifi className="tw:size-3.5" />
              )}
              Scan UPnP ports
            </Button>
          )}
        </div>

        {/* Ports table */}
        {ports.length > 0 && (
          <div className="tw:rounded-lg tw:border tw:overflow-hidden">
            <table className="tw:w-full tw:text-sm">
              <thead className="tw:bg-muted/50">
                <tr>
                  <th className="tw:p-2 tw:text-left tw:font-medium">Port</th>
                  <th className="tw:p-2 tw:text-left tw:font-medium">Protocol</th>
                  <th className="tw:p-2 tw:text-left tw:font-medium">Service</th>
                  {apiReqStatus.result && <th className="tw:p-2 tw:text-left tw:font-medium">API</th>}
                  {upnpReqStatus.result && <th className="tw:p-2 tw:text-left tw:font-medium">UPnP</th>}
                </tr>
              </thead>
              <tbody>
                {ports.map((port, i) => {
                  const apiMatch = apiReqStatus.result?.find((p) => p.port === port.portNumber);
                  const upnpMatch = upnpReqStatus.result?.find((p) => p.port === port.portNumber);
                  return (
                    <tr key={i} className="tw:border-t">
                      <td className="tw:p-2">{port.portNumber}</td>
                      <td className="tw:p-2">
                        <Badge variant="outline">{port.protocol}</Badge>
                      </td>
                      <td className="tw:p-2 tw:text-muted-foreground">{prettyDnpName(port.serviceName)}</td>
                      {apiReqStatus.result && (
                        <td className="tw:p-2">
                          <PortStatusBadge status={apiMatch?.status} />
                        </td>
                      )}
                      {upnpReqStatus.result && (
                        <td className="tw:p-2">
                          <PortStatusBadge status={upnpMatch?.status} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PortStatusBadge({ status }: { status?: string }) {
  if (!status || status === "unknown") return <Badge variant="secondary">Unknown</Badge>;
  if (status === "open") return <Badge variant="success">Open</Badge>;
  if (status === "closed") return <Badge variant="destructive">Closed</Badge>;
  return <Badge variant="destructive">{status}</Badge>;
}
