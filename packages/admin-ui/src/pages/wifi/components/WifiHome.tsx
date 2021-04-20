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
import WifiService from "./WifiService";
import WifiCredentials from "./WifiCredentials";

const WifiHome: React.FC<RouteComponentProps> = ({ match }) => {
  const availableRoutes = [
    {
      name: "Service",
      subPath: subPaths.service,
      component: WifiService
    },
    {
      name: "Credentials",
      subPath: subPaths.credentials,
      component: WifiCredentials
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

export default WifiHome;

// Brief introduction
// Allow to change restart policy?
// Show wifi status (if no running show why)
// Show wifi creds and settings (setupwizard)
// Allow to change wifi credentials
// Add default dappnode wifi hostpot credentials somewhere
// Add explanation of: internalIP === externalIP

// issue stop avahi daemon (it exposes UI in internal network port 80)
