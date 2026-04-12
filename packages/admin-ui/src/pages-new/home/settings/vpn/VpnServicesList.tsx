import React, { useMemo } from "react";
import { useApi } from "api";
import { useNavigate } from "react-router-dom";
import { vpnDnpName, wireguardDnpName, tailscaleDnpName, docsUrl } from "params";
import { prettyDnpName } from "utils/format";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Badge } from "components/primitives/badge";
import { Button } from "components/primitives/button";
import { Skeleton } from "components/primitives/skeleton";
import { ExternalLink, Shield, ChevronRight } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────── */

interface VpnServiceInfo {
  name: string;
  dnpName: string;
  installed: boolean;
  running: boolean;
  /** Route within the VPN tab (relative to /settings/vpn/) */
  route: string;
}

/* ── Service card ───────────────────────────────────────────────────── */

function VpnServiceCard({ service, onNavigate }: { service: VpnServiceInfo; onNavigate: (route: string) => void }) {
  return (
    <div
      className="tw:flex tw:items-center tw:justify-between tw:rounded-lg tw:border tw:p-4 tw:cursor-pointer tw:transition-colors tw:hover:bg-muted/50"
      onClick={() => service.installed && onNavigate(service.route)}
      role={service.installed ? "button" : undefined}
    >
      <div className="tw:flex tw:items-start tw:gap-3">
        <Shield className="tw:size-5 tw:mt-0.5 tw:text-muted-foreground tw:shrink-0" />
        <div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <p className="tw:text-sm tw:font-medium">{service.name}</p>
            {service.installed ? (
              <Badge variant={service.running ? "success" : "secondary"}>
                {service.running ? "Running" : "Stopped"}
              </Badge>
            ) : (
              <Badge variant="outline">Not installed</Badge>
            )}
          </div>
          <p className="tw:text-xs tw:text-muted-foreground tw:mt-1">{prettyDnpName(service.dnpName)}</p>
        </div>
      </div>
      {service.installed && <ChevronRight className="tw:size-4 tw:text-muted-foreground tw:shrink-0" />}
    </div>
  );
}

/* ── Main list ──────────────────────────────────────────────────────── */

export function VpnServicesList() {
  const navigate = useNavigate();
  const dnpsRequest = useApi.packagesGet();

  const vpnServices: VpnServiceInfo[] = useMemo(() => {
    const dnps = dnpsRequest.data || [];
    const getDnp = (name: string) => dnps.find((d) => d.dnpName === name);

    const services: VpnServiceInfo[] = [
      {
        name: "Tailscale",
        dnpName: tailscaleDnpName,
        installed: !!getDnp(tailscaleDnpName),
        running: getDnp(tailscaleDnpName)?.containers.some((c) => c.running) ?? false,
        route: "tailscale"
      },
      {
        name: "Wireguard",
        dnpName: wireguardDnpName,
        installed: !!getDnp(wireguardDnpName),
        running: getDnp(wireguardDnpName)?.containers.some((c) => c.running) ?? false,
        route: "wireguard"
      },
      {
        name: "OpenVPN",
        dnpName: vpnDnpName,
        installed: !!getDnp(vpnDnpName),
        running: getDnp(vpnDnpName)?.containers.some((c) => c.running) ?? false,
        route: "openvpn"
      }
    ];

    return services.sort((a, b) => (a.installed && !b.installed ? -1 : !a.installed && b.installed ? 1 : 0));
  }, [dnpsRequest.data]);

  if (dnpsRequest.isValidating && !dnpsRequest.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">VPN Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="tw:h-32 tw:w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">VPN Services</CardTitle>
        <CardDescription>
          VPN services available on your Dappnode. Click on an installed service to manage its devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-3">
        {vpnServices.map((service) => (
          <VpnServiceCard key={service.dnpName} service={service} onNavigate={(route) => navigate(route)} />
        ))}

        <div className="tw:pt-2">
          <Button variant="outline" asChild>
            <a href={docsUrl.connectVpn} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="tw:size-3.5" />
              VPN setup guide
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
