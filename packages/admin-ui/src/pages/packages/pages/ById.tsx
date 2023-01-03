import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { Switch, Route, NavLink, Redirect } from "react-router-dom";
import { useApi } from "api";
import { isEmpty } from "lodash-es";
// This module
import { Info } from "../components/Info";
import { Logs } from "../components/Logs";
import { Config } from "../components/Config";
import { FileManager } from "../components/FileManager";
import { Backup } from "../components/Backup";
import { NoDnpInstalled } from "../components/NoDnpInstalled";
import { Network } from "../components/Network";
import { title } from "../data";
// Components
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
import Title from "components/Title";
// Utils
import { prettyDnpName } from "utils/format";
import { AlertPackageUpdateAvailable } from "../components/AlertPackageUpdateAvailable";

export const PackageById: React.FC<RouteComponentProps<{
  id: string;
}>> = ({ match }) => {
  const id = decodeURIComponent(match.params.id || "");

  const dnpRequest = useApi.packageGet({ dnpName: id });
  const dnp = dnpRequest.data;
  if (!dnp) {
    return (
      <>
        <Title title={title} subtitle={id} />
        {dnpRequest.isValidating ? (
          <Loading steps={[`Loading ${prettyDnpName(id)}`]} />
        ) : dnpRequest.error ? (
          dnpRequest.error.message.includes("package not found") ? (
            <NoDnpInstalled id={id} />
          ) : (
            <ErrorView error={dnpRequest.error} />
          )
        ) : null}
      </>
    );
  }

  const dnpName = dnp.dnpName;
  const {
    userSettings,
    setupWizard,
    manifest,
    gettingStarted,
    gettingStartedShow,
    backup = [],
    containers,
    updateAvailable
  } = dnp;

  /**
   * Construct all subroutes to iterate them both in:
   * - Link (to)
   * - Route (render, path)
   */
  const availableRoutes: {
    name: string;
    subPath: string;
    render: () => JSX.Element;
  }[] = [
    {
      name: "Info",
      subPath: "info",
      render: () => (
        <Info dnp={dnp} {...{ manifest, gettingStarted, gettingStartedShow }} />
      ),
      available: true
    },
    {
      name: "Config",
      subPath: "config",
      render: () => (
        <Config dnpName={dnpName} {...{ userSettings, setupWizard }} />
      ),
      available: userSettings && !isEmpty(userSettings.environment)
    },
    {
      name: "Network",
      subPath: "network",
      render: () => <Network containers={containers} />,
      available: dnpName !== "dappmanager.dnp.dappnode.eth"
    },
    {
      name: "Logs",
      subPath: "logs",
      render: () => <Logs containers={containers} />,
      available: true
    },
    {
      name: "Backup",
      subPath: "backup",
      render: () => <Backup dnpName={dnpName} {...{ backup }} />,
      available: backup.length > 0
    },
    {
      name: "File Manager",
      subPath: "file-manager",
      render: () => <FileManager containers={containers} />,
      available: true
    }
  ].filter(route => route.available);

  return (
    <>
      <Title title={title} subtitle={prettyDnpName(dnpName)} />

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

      {updateAvailable && (
        <AlertPackageUpdateAvailable
          dnpName={dnpName}
          updateAvailable={updateAvailable}
        ></AlertPackageUpdateAvailable>
      )}

      <div className="packages-content">
        <Switch>
          {availableRoutes.map(route => (
            <Route
              key={route.subPath}
              path={`${match.path}/${route.subPath}`}
              render={route.render}
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
