import React, { useMemo, useEffect } from "react";
import {
  NavLink,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { useApi } from "api";
import { title, subPaths } from "../data";
import { OpenVpnDevicesRoot } from "./openvpn/OpenVpnDevicesRoot";
import { WireguardDevicesRoot } from "./wireguard/WireguardDevicesRoot";
import Title from "components/Title";
import { docsUrl, vpnDnpName, wireguardDnpName } from "params";
import LinkDocs from "components/LinkDocs";

export function VpnHome() {
  const navigate = useNavigate();
  const dnpsRequest = useApi.packagesGet();
  const availableRoutes = useMemo(() => {
    const dnpsSet = dnpsRequest.data
      ? new Set(dnpsRequest.data.map(dnp => dnp.dnpName))
      : new Set<string>();

    const routes: {
      name: string;
      subPath: string;
      component: React.ComponentType<any>;
      installed: boolean;
    }[] = [
        {
          name: "OpenVpn",
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

    return routes.sort((a, b) =>
      a.installed && !b.installed ? -1 : !a.installed && b.installed ? 1 : 0
    );
  }, [dnpsRequest.data]);

  // Redirect automatically to the first route. DO NOT hardcode
  // to prevent typos and causing infinite loops 
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    navigate(`${availableRoutes[0].subPath}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <>
      <Title title={title} />
      <div className="horizontal-navbar">
        {availableRoutes.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={route.subPath}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {route.name}
            </NavLink>
          </button>
        ))}
      </div>

      <p>
        Create a VPN profile for each of your devices (laptop, phone) so you can
        access your DAppNode from an external network. Learn more about VPN at:{" "}
        <LinkDocs href={docsUrl.connectVpn}>
          How to connect to your DAppNode VPN
        </LinkDocs>
      </p>

      <div className="section-spacing">
        <Routes>
          {availableRoutes.map(route => (
            <Route
              key={route.subPath}
              path={route.subPath}
              element={<route.component />}
            />
          ))}
        </Routes>
      </div>
    </>
  );
}
