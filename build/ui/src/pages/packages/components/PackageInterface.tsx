import React from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { Switch, Route, NavLink, Redirect } from "react-router-dom";
import useSWR from "swr";
import { api } from "api";
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
import Error from "components/Error";
import Title from "components/Title";
// Utils
import { shortNameCapitalized } from "utils/format";
// Selectors
import { getDnpInstalledStatus } from "services/dnpInstalled/selectors";

export const PackageInterface: React.FC<
  RouteComponentProps<{ id: string }>
> = ({ match }) => {
  const id = decodeURIComponent(match.params.id || "");

  // Fetching status
  const { loading, error } = useSelector(getDnpInstalledStatus);
  const areThereDnps = useSelector(s.areThereDnps);
  // Dnp data
  const dnp = useSelector((state: any) => s.getDnpById(state, id));
  const { data: dnpDetail } = useSWR([id, "packageDetailDataGet"], id =>
    api.packageDetailDataGet({ id })
  );

  if (!dnp) {
    return (
      <>
        <Title title={title} subtitle={id} />
        {loading ? (
          <Loading msg="Loading your DAppNode Packages..." />
        ) : error ? (
          <Error msg={`Error loading your DAppNode Packages: ${error}`} />
        ) : areThereDnps ? (
          <NoDnpInstalled id={id} />
        ) : (
          <Error msg={`Unknown error, package not found`} />
        )}
      </>
    );
  }

  const DnpSpecific = dnpSpecific[dnp.name];
  const backup = (dnp.manifest || {}).backup || [];

  /**
   * Construct all subroutes to iterate them both in:
   * - Link (to)
   * - Route (render, path)
   */
  const availableRoutes = [
    {
      name: "Info",
      subPath: "info",
      render: () => <Info dnp={dnp} dnpDetail={dnpDetail} />,
      available: true
    },
    {
      name: "Controls",
      subPath: "controls",
      render: () => <Controls dnp={dnp} />,
      available: true
    },
    {
      name: "Config",
      subPath: "config",
      render: () => <Config dnp={dnp} dnpDetail={dnpDetail} />,
      available: !isEmpty(dnp.envs) || !isEmpty((dnpDetail || {}).setupWizard)
    },
    {
      name: "Ports",
      subPath: "ports",
      render: () => <Ports dnp={dnp} />,
      available: dnp.name !== "dappmanager.dnp.dappnode.eth"
    },
    {
      name: "Logs",
      subPath: "logs",
      render: () => <Logs id={dnp.name} />,
      available: true
    },
    {
      name: "Backup",
      subPath: "backup",
      render: () => <Backup id={dnp.name} backup={backup} />,
      available: backup.length > 0
    },
    {
      name: "File Manager",
      subPath: "file-manager",
      render: () => <FileManager id={dnp.name} />,
      available: true
    },
    // DnpSpecific is a variable dynamic per DNP component
    {
      name: dnpSpecificList[dnp.name],
      // Convert name to subPath:
      // "Connect with peers" => "connect-with-peers"
      subPath: encodeURIComponent(
        (dnpSpecificList[dnp.name] || "")
          .toLowerCase()
          .replace(new RegExp(" ", "g"), "-")
      ),
      render: () => <DnpSpecific dnp={dnp} />,
      available: DnpSpecific && dnpSpecificList[dnp.name]
    }
  ].filter(route => route.available);

  return (
    <>
      <Title title={title} subtitle={shortNameCapitalized(dnp.name || id)} />

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
