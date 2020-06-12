import React from "react";
import { Switch, Route, RouteComponentProps } from "react-router-dom";
// Components
import { InstallerHome } from "./InstallerHome";
import InstallDnpContainer from "./InstallDnpContainer";
// Modules

const InstallerRoot: React.FC<RouteComponentProps> = ({ match }) => (
  <Switch>
    <Route exact path={match.path} component={InstallerHome} />
    <Route path={match.path + "/:id"} component={InstallDnpContainer} />
  </Switch>
);

export default InstallerRoot;
