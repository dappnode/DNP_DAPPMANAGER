import React from "react";
import { Routes, Route, NavLink, useParams, Link } from "react-router-dom";
import { useApi } from "api";
import { capitalize, isEmpty } from "lodash-es";
// This module
import { Info } from "../components/Info";
import { Logs } from "../components/Logs";
import { Config } from "../components/Config";
import { FileManager } from "../components/FileManager";
import { Backup } from "../components/Backup";
import { NoDnpInstalled } from "../components/NoDnpInstalled";
import { Network } from "../components/Network";
import { basePath, mySubPath, systemSubPath } from "../data";
// Components
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";
import Title from "components/Title";
// Utils
import { prettyDnpName } from "utils/format";
import { AlertPackageUpdateAvailable } from "../components/AlertPackageUpdateAvailable";
import { MdKeyboardArrowLeft } from "react-icons/md";
import "../components/packages.scss";

export const PackageById: React.FC = () => {
  const params = useParams();
  const id = params.id || "";

  const dnpRequest = useApi.packageGet({ dnpName: id });
  const dnp = dnpRequest.data;

  if (!dnp) {
    return (
      <>
        {dnpRequest.isValidating ? (
          <Loading steps={[`Loading ${prettyDnpName(id)}`]} />
        ) : (
          <>
            <Title title={id} />
            {dnpRequest.error &&
              (dnpRequest.error.message.includes("package not found") ? (
                <NoDnpInstalled id={id} />
              ) : (
                <ErrorView error={dnpRequest.error} />
              ))}
          </>
        )}
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
    updateAvailable,
    isCore
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
      render: () => <Info dnp={dnp} {...{ manifest, gettingStarted, gettingStartedShow }} />,
      available: true
    },
    {
      name: "Config",
      subPath: "config",
      render: () => <Config dnpName={dnpName} {...{ userSettings, setupWizard }} />,
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
  ].filter((route) => route.available);

  return (
    <div>
      <Link to={isCore ? `/${basePath}/${systemSubPath}` : `/${basePath}/${mySubPath}`} className="pkgs-back-btn">
        <MdKeyboardArrowLeft />
        <span>{capitalize(isCore ? `${systemSubPath}` : `${mySubPath}`)} packages</span>
      </Link>

      <Title title={prettyDnpName(dnpName)} />
      <div className="horizontal-navbar">
        {availableRoutes.map((route) => (
          <button key={route.subPath} className="item-container">
            <NavLink to={route.subPath} className="item no-a-style" style={{ whiteSpace: "nowrap" }}>
              {route.name}
            </NavLink>
          </button>
        ))}
      </div>

      {updateAvailable && (
        <AlertPackageUpdateAvailable dnpName={dnpName} updateAvailable={updateAvailable}></AlertPackageUpdateAvailable>
      )}

      <div className="packages-content">
        <Routes>
          {availableRoutes.map((route) => (
            <Route key={route.subPath} path={route.subPath} element={route.render()} />
          ))}
        </Routes>
      </div>
    </div>
  );
};
