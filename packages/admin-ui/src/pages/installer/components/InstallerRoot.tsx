import React from "react";
import { Switch, Route, RouteComponentProps, Redirect } from "react-router-dom";
// Components
import InstallDnpContainer from "./InstallDnpContainer";
import { title, rootPath, subPathPublic } from "../data";
import Title from "components/Title";
import { InstallerDnp } from "./dappnodeDappstore/InstallerDnp";
import { InstallerPublic } from "./publicDappstore/InstallerPublic";
// Styles
import "./installer.scss";

const InstallerRoot: React.FC<RouteComponentProps> = ({ match }) => {
  return (
    <>
      <Title title={title} />

      <Switch>
        {/*Root path: dappstore dnp*/}
        <Route
          key={rootPath}
          exact
          path={match.path}
          component={InstallerDnp}
        />
        {/*Public path: dappstore public*/}
        <Route
          key={subPathPublic}
          path={match.path + subPathPublic}
          component={InstallerPublic}
        />
        {/*DNP installer path*/}
        <Route path={match.path + "/:id"} component={InstallDnpContainer} />
        <Redirect to={rootPath} />
      </Switch>
    </>
  );
};

export default InstallerRoot;
