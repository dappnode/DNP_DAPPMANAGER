import React from "react";
import {
  Switch,
  Route,
  NavLink,
  Redirect,
  RouteComponentProps
} from "react-router-dom";
// Own module
import { communityTypes, title } from "../data";
import CommunityDiscord from "./CommunityDiscord";
import CommunityGithub from "./CommunityGithub";
import CommunityDiscourse from "./CommunityDiscourse";
import CommunityTreasury from "./CommunityTreasury";
import CommunityGrants from "./CommunityGrants";
// Components
import Title from "components/Title";

const CommunityHome: React.FC<RouteComponentProps> = ({ match }) => {
  const availableRoutes = [
    {
      name: "Discord",
      subPath: communityTypes.discord.subPath,
      component: CommunityDiscord
    },
    {
      name: "Github",
      subPath: communityTypes.github.subPath,
      component: CommunityGithub
    },
    {
      name: "Discourse",
      subPath: communityTypes.discourse.subPath,
      component: CommunityDiscourse
    },
    {
      name: "Treasury",
      subPath: communityTypes.treasury.subPath,
      component: CommunityTreasury
    },
    {
      name: "Grants",
      subPath: communityTypes.grants.subPath,
      component: CommunityGrants
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

export default CommunityHome;
