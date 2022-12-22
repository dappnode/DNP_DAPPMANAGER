import React from "react";
import Eth from "./Eth";
import Ipfs from "./Ipfs";
import {
  NavLink,
  Redirect,
  Route,
  RouteComponentProps,
  Switch
} from "react-router-dom";
import { subPaths, title } from "../data";
import Title from "components/Title";

export const Repository: React.FC<RouteComponentProps> = ({ match }) => {
  const availableRoutes: {
    name: string;
    subPath: string;
    component: React.ComponentType<any>;
  }[] = [
    {
      name: "Ethereum",
      subPath: subPaths.eth,
      component: Eth
    },
    {
      name: "IPFS",
      subPath: subPaths.ipfs,
      component: Ipfs
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
