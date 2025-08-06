import React from "react";
import { title, subPaths } from "../data";
import { RouteType } from "types";
// Components
import Title from "components/Title";
import AutoUpdates from "./AutoUpdates";
import App from "./App";
import Security from "./Security";
import PowerManagment from "./PowerManagment";
import SystemUpdate from "./SystemUpdate";
import Peers from "./Peers";
import SystemInfo from "./SystemInfo";
import Profile from "./Profile";
import { Network } from "./Network";
import { Advanced } from "./Advanced";
import Hardware from "./Hardware";
import { SectionNavigator } from "components/SectionNavigator";

const SystemRoot: React.FC = () => {
  const availableRoutes: RouteType[] = [
    {
      name: "Info",
      subPath: subPaths.info,
      component: SystemInfo
    },
    {
      name: "Auto updates",
      subPath: subPaths.autoUpdates,
      component: AutoUpdates
    },
    {
      name: "App",
      subPath: subPaths.app,
      component: App
    },
    {
      name: "Profile",
      subPath: subPaths.profile,
      component: Profile
    },
    {
      name: "Power",
      subPath: subPaths.power,
      component: PowerManagment
    },
    {
      name: "Network",
      subPath: subPaths.network,
      component: Network
    },
    {
      name: "Update",
      subPath: subPaths.update,
      component: SystemUpdate
    },
    {
      name: "Peers",
      subPath: subPaths.peers + "/*",
      component: Peers
    },
    {
      name: "Security",
      subPath: subPaths.security,
      component: Security
    },
    {
      name: "Hardware",
      subPath: subPaths.hardware,
      component: Hardware
    },
    {
      name: "Advanced",
      subPath: subPaths.advanced,
      component: Advanced
    }
  ];

  return (
    <>
      <Title title={title} />
      <SectionNavigator routes={availableRoutes} />
    </>
  );
};

export default SystemRoot;
