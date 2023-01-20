import React from "react";
import { title, subPaths } from "../data";
import {
  Switch,
  Route,
  NavLink,
  Redirect,
  RouteComponentProps
} from "react-router-dom";
// Components
import Title from "components/Title";
import AutoUpdates from "./AutoUpdates";
import Security from "./Security";
import PowerManagment from "./PowerManagment";
import SystemUpdate from "./SystemUpdate";
import Peers from "./Peers";
import Identity from "./Identity";
import SystemInfo from "./SystemInfo";
import Profile from "./Profile";
import { Network } from "./Network";
import { Advanced } from "./Advanced";
import { Notifications } from "./Notifications";
import Hardware from "./Hardware";

const SystemRoot: React.FC<RouteComponentProps> = ({ match }) => {
  /**
   * Construct all subroutes to iterate them both in:
   * - Link (to)
   * - Route (render, path)
   */
  const availableRoutes: {
    name: string;
    subPath: string;
    component: React.ComponentType<any>;
    hideFromMenu?: boolean;
  }[] = [
    {
      name: "Info",
      subPath: subPaths.info,
      component: SystemInfo
    },
    {
      name: "Notifications",
      subPath: subPaths.notifications,
      component: Notifications
    },
    {
      name: "Identity",
      subPath: subPaths.identity,
      component: Identity,
      hideFromMenu: true
    },
    {
      name: "Auto updates",
      subPath: subPaths.autoUpdates,
      component: AutoUpdates
    },
    {
      name: "Network",
      subPath: subPaths.network,
      component: Network
    },
    {
      name: "Update",
      subPath: subPaths.update,
      component: SystemUpdate,
      hideFromMenu: true
    },
    {
      name: "Profile",
      subPath: subPaths.profile,
      component: Profile
    },
    {
      name: "Peers",
      subPath: subPaths.peers,
      component: Peers
    },
    {
      name: "Security",
      subPath: subPaths.security,
      component: Security
    },
    {
      name: "Hardware",
      subPath: subPaths.hardware,
      component: Hardware
    },
    {
      name: "Advanced",
      subPath: subPaths.advanced,
      component: Advanced
    },
    {
      name: "Power",
      subPath: subPaths.power,
      component: PowerManagment
    }
  ];

  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {availableRoutes
          .filter(route => !route.hideFromMenu)
          .map(route => (
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

export default SystemRoot;
