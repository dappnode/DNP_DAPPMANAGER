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
import StaticIp from "./StaticIp";
import AutoUpdates from "./AutoUpdates";
import Repository from "./Repository";
import Security from "./Security";
import PowerManagment from "./PowerManagment";
import SystemUpdate from "./SystemUpdate";
import Peers from "./Peers";
import Identity from "./Identity";
import SystemInfo from "./SystemInfo";
import Title from "components/Title";

const SystemRoot: React.FunctionComponent<RouteComponentProps> = ({
  match
}) => {
  /**
   * Construct all subroutes to iterate them both in:
   * - Link (to)
   * - Route (render, path)
   */
  const availableRoutes = [
    {
      name: "Info",
      subPath: subPaths.info,
      component: SystemInfo
    },
    {
      name: "Identity",
      subPath: subPaths.identity,
      component: Identity,
      hideFromMenu: true
    },
    {
      name: "Security",
      subPath: subPaths.security,
      component: Security
    },
    {
      name: "Auto updates",
      subPath: subPaths.autoUpdates,
      component: AutoUpdates
    },
    {
      name: "Repository",
      subPath: subPaths.repository,
      component: Repository
    },
    {
      name: "Static IP",
      subPath: subPaths.staticIp,
      component: StaticIp
    },
    {
      name: "Update",
      subPath: subPaths.update,
      component: SystemUpdate,
      hideFromMenu: true
    },
    {
      name: "Peers",
      subPath: subPaths.peers,
      component: Peers
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
