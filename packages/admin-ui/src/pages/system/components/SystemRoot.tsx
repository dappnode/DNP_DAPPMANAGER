import React from "react";
import { title, subPaths } from "../data";
import { Routes, Route, NavLink } from "react-router-dom";
// Components
import Title from "components/Title";
import AutoUpdates from "./AutoUpdates";
import Security from "./Security";
import PowerManagment from "./PowerManagment";
import SystemUpdate from "./SystemUpdate";
import Peers from "./Peers";
import SystemInfo from "./SystemInfo";
import Profile from "./Profile";
import { Network } from "./Network";
import { Advanced } from "./Advanced";
import Hardware from "./Hardware";

const SystemRoot: React.FC = () => {
  const availableRoutes: {
    name: string;
    subLink: string;
    subPath: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType<any>;
    hideFromMenu?: boolean;
  }[] = [
    {
      name: "Info",
      subLink: subPaths.info,
      subPath: subPaths.info,
      component: SystemInfo
    },
    {
      name: "Auto updates",
      subLink: subPaths.autoUpdates,
      subPath: subPaths.autoUpdates,
      component: AutoUpdates
    },
    {
      name: "Profile",
      subLink: subPaths.profile,
      subPath: subPaths.profile,
      component: Profile
    },
    {
      name: "Power",
      subLink: subPaths.power,
      subPath: subPaths.power,
      component: PowerManagment
    },
    {
      name: "Network",
      subLink: subPaths.network,
      subPath: subPaths.network,
      component: Network
    },
    {
      name: "Update",
      subLink: subPaths.update,
      subPath: subPaths.update,
      component: SystemUpdate
    },

    {
      name: "Peers",
      subLink: subPaths.peers,
      subPath: subPaths.peers + "/*",
      component: Peers
    },
    {
      name: "Security",
      subLink: subPaths.security,
      subPath: subPaths.security,
      component: Security
    },
    {
      name: "Hardware",
      subLink: subPaths.hardware,
      subPath: subPaths.hardware,
      component: Hardware
    },
    {
      name: "Advanced",
      subLink: subPaths.advanced,
      subPath: subPaths.advanced,
      component: Advanced
    }
  ];

  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {availableRoutes
          .filter((route) => !route.hideFromMenu)
          .map((route) => (
            <button key={route.subPath} className="item-container">
              <NavLink to={route.subLink} className="item no-a-style" style={{ whiteSpace: "nowrap" }}>
                {route.name}
              </NavLink>
            </button>
          ))}
      </div>

      <div className="section-spacing">
        <Routes>
          {availableRoutes.map((route) => (
            <Route key={route.subPath} path={route.subPath} element={<route.component />} />
          ))}
        </Routes>
      </div>
    </>
  );
};

export default SystemRoot;
