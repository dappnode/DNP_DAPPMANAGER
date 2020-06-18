import React from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { Switch, Route, NavLink, Redirect } from "react-router-dom";
import { useApi } from "api";
import { isEmpty } from "lodash";
// This module
import Info from "./PackageViews/Info";
import { dnpSpecificList, dnpSpecific } from "./PackageViews/DnpSpecific";
import Logs from "./PackageViews/Logs";
import Config from "./PackageViews/Config";
import Ports from "./PackageViews/Ports";
import { FileManager } from "./PackageViews/FileManager";
import Backup from "./PackageViews/Backup";
import { Controls } from "./PackageViews/Controls";
import NoDnpInstalled from "./NoDnpInstalled";
import * as s from "../selectors";
import { title } from "../data";
// Components
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
import Title from "components/Title";
// Utils
import { shortNameCapitalized } from "utils/format";


export const PackageInterface: React.FC<RouteComponentProps<{
  id: string;
}>> = ({ match }) => {
  const id = decodeURIComponent(match.params.id || "");

  const dnpRequest = useApi.packageGet({ id });
  const dnp = dnpRequest.data;
  if (!dnp) {
    return (
      <>
        <Title title={title} subtitle={id} />
        {dnpRequest.isValidating ? (
          <Loading steps={["Loading your DAppNode Packages"]} />
        ) : dnpRequest.error ? (
          dnpRequest.error.message.includes("package not found") ? (
            <NoDnpInstalled id={id} />
          ) : (
            <ErrorView error={dnpRequest.error} />
          )
        ) : (
          <ErrorView error="Unknown error, package not found" />
        )}
      </>
    );
  }

  const DnpSpecific = dnpSpecific[dnp.name];

  const dnpName = dnp.name;
  const {
    isCore,
    state,
    volumes,
    ports,
    userSettings,
    setupWizard,
    manifest,
    gettingStarted,
    gettingStartedShow,
    volumesSize: volumesDetail
  } = dnp;
  const { backup = [] } = manifest || {};

  /**
   * Construct all subroutes to iterate them both in:
   * - Link (to)
   * - Route (render, path)
   */
  const availableRoutes = [
    {
      name: "Info",
      subPath: "info",
      render: () => (
        <Info
          dnp={dnp}
          {...{ manifest, gettingStarted, gettingStartedShow, volumesDetail }}
        />
      ),
      available: true
    },
    {
      name: "Controls",
      subPath: "controls",
      render: () => <Controls id={dnpName} {...{ isCore, state, volumes }} />,
      available: true
    },
    {
      name: "Config",
      subPath: "config",
      render: () => <Config id={dnpName} {...{ userSettings, setupWizard }} />,
      available: userSettings && !isEmpty(userSettings.environment)
    },
    {
      name: "Ports",
      subPath: "ports",
      render: () => <Ports id={dnpName} {...{ ports }} />,
      available: dnpName !== "dappmanager.dnp.dappnode.eth"
    },
    {
      name: "Logs",
      subPath: "logs",
      render: () => <Logs id={dnpName} />,
      available: true
    },
    {
      name: "Backup",
      subPath: "backup",
      render: () => <Backup id={dnpName} {...{ backup }} />,
      available: backup.length > 0
    },
    {
      name: "File Manager",
      subPath: "file-manager",
      render: () => <FileManager id={dnpName} />,
      available: true
    },
    // DnpSpecific is a variable dynamic per DNP component
    {
      name: dnpSpecificList[dnpName],
      // Convert name to subPath:
      // "Connect with peers" => "connect-with-peers"
      subPath: encodeURIComponent(
        (dnpSpecificList[dnpName] || "")
          .toLowerCase()
          .replace(new RegExp(" ", "g"), "-")
      ),
      render: () => <DnpSpecific dnp={dnp} />,
      available: DnpSpecific && dnpSpecificList[dnpName]
    }
  ].filter(route => route.available);

  return (
    <>
      <Title title={title} subtitle={shortNameCapitalized(dnpName || id)} />

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
