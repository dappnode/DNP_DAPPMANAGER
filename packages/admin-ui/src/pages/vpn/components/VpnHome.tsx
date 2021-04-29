import React from "react";
import {
  NavLink,
  Switch,
  Route,
  Redirect,
  RouteComponentProps
} from "react-router-dom";
import { title, subPaths } from "../data";
import { OpenVpnDevicesRoot } from "./openvpn/OpenVpnDevicesRoot";
import { WireguardDevicesRoot } from "./wireguard/WireguardDevicesRoot";

// Components
import Title from "components/Title";

const VpnHome: React.FC<RouteComponentProps> = ({ match }) => {
  const availableRoutes = [
    {
      name: "OpenVpn",
      subPath: subPaths.openVpn,
      component: OpenVpnDevicesRoot
    },
    {
      name: "Wireguard",
      subPath: subPaths.wireguard,
      component: WireguardDevicesRoot
    }
  ];
  return (
    <>
      <Title title={title} />
      <div className="horizontal-navbar">
        {availableRoutes.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={`${match.url}/${route.subPath}`}
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
        access your DAppNode from an external network
      </p>

      <div className="section-spacing">
        <Switch>
          {availableRoutes.map(route => (
            <Route
              key={route.subPath}
              path={`${match.path}/${route.subPath}`}
              component={route.component}
            />
          ))}
          {/* Redirect automatically to the first route. DO NOT hardcode 
              to prevent typos and causing infinite loops */}
          <Redirect to={`${match.url}/${availableRoutes[0].subPath}`} />
        </Switch>
      </div>
    </>
  );
};

export default VpnHome;
