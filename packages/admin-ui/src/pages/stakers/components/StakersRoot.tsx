import Title from "components/Title";
import React from "react";
import {
  RouteComponentProps,
  NavLink,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import { title } from "../data";
import StakerNetwork from "./StakerNetwork";

const StakersRoot: React.FC<RouteComponentProps> = ({ match }) => {
  const stakersItems: {
    subPath: string;
    title: string;
    component: JSX.Element;
  }[] = [
    {
      subPath: "mainnet",
      title: "Mainnet",
      component: StakerNetwork({
        network: "mainnet",
        description: "Mainnet stakers"
      })
    },
    {
      subPath: "gnoexecutionClientsis",
      title: "Gnosis chain",
      component: StakerNetwork({
        network: "gnosis",
        description: "Gnosis stakers"
      })
    },
    {
      subPath: "prater",
      title: "Prater",
      component: StakerNetwork({
        network: "prater",
        description: "Prater stakers"
      })
    }
  ];
  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {stakersItems.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={`${match.url}/${route.subPath}`}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {route.title}
            </NavLink>
          </button>
        ))}
      </div>

      <div className="section-spacing">
        <Switch>
          {stakersItems.map(route => (
            <Route key={route.subPath} path={`${match.path}/${route.subPath}`}>
              {route.component}
            </Route>
          ))}
          {/* Redirect automatically to the first route. DO NOT hardcode 
              to prevent typos and causing infinite loops */}
          <Redirect to={`${match.url}/${stakersItems[0].subPath}`} />
        </Switch>
      </div>
    </>
  );
};

export default StakersRoot;
