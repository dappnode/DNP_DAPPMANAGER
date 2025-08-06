import React, { useMemo } from "react";
import { useApi } from "api";
import { title, subPaths } from "../data";
import { OpenVpnDevicesRoot } from "./openvpn/OpenVpnDevicesRoot";
import { WireguardDevicesRoot } from "./wireguard/WireguardDevicesRoot";
import Title from "components/Title";
import { vpnDnpName, wireguardDnpName, tailscaleDnpName } from "params";
import { TailscaleVpn } from "./TailscaleVpn";
import { SectionNavigator } from "components/SectionNavigator";
import { RouteType } from "types";

export function VpnHome() {
  const dnpsRequest = useApi.packagesGet();

  const availableRoutes = useMemo(() => {
    const dnpsSet = dnpsRequest.data ? new Set(dnpsRequest.data.map((dnp) => dnp.dnpName)) : new Set<string>();

    const routes: Array<RouteType & { installed: boolean }> = [
      {
        name: "Tailscale",
        subPath: subPaths.tailscale,
        component: TailscaleVpn,
        installed: dnpsSet.has(tailscaleDnpName)
      },
      {
        name: "OpenVPN",
        subPath: subPaths.openVpn,
        component: OpenVpnDevicesRoot,
        installed: dnpsSet.has(vpnDnpName)
      },
      {
        name: "Wireguard",
        subPath: subPaths.wireguard,
        component: WireguardDevicesRoot,
        installed: dnpsSet.has(wireguardDnpName)
      }
    ];

    return routes.sort((a, b) => (a.installed && !b.installed ? -1 : !a.installed && b.installed ? 1 : 0));
  }, [dnpsRequest.data]);

  return (
    <>
      <Title title={title} />
      <SectionNavigator routes={availableRoutes} />
    </>
  );
}
