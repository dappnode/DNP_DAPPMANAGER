import React from "react";
import { Switch, Route, RouteComponentProps } from "react-router-dom";
import { systemPackagesSubPath } from "./data";
// Components
import { PackagesHome } from "./pages/Home";
import { PackageById } from "./pages/ById";
// Style
import "./components/packages.scss";

export const PackagesRoot: React.FC<RouteComponentProps> = ({ match }) => (
  <Switch>
    <Route exact path={match.path} component={PackagesHome} />
    <Route
      path={match.path + systemPackagesSubPath}
      render={props => <PackagesHome {...props} showCoreDnps={true} />}
    />
    <Route path={match.path + "/:id"} component={PackageById} />
  </Switch>
);
