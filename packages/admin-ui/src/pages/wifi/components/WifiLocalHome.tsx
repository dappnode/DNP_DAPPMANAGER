import React from "react";
import {
  Switch,
  Route,
  NavLink,
  Redirect,
  RouteComponentProps
} from "react-router-dom";
// Own module
import { title, subPaths } from "../data";
// Components
import Title from "components/Title";
import WifiHome from "./wifi/WifiHome";
import { LocalProxying } from "./localProxying/LocalProxying";
// CSS
import "./wifiLocal.scss";

export const WifiLocalHome: React.FC<RouteComponentProps> = ({ match }) => {
  const availableRoutes: {
    name: string;
    subPath: string;
    component: React.ComponentType<any>;
  }[] = [
    {
      name: "Wi-Fi",
      subPath: subPaths.wifi,
      component: WifiHome
    },
    {
      name: "Local Network",
      subPath: subPaths.local,
      component: LocalProxying
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
