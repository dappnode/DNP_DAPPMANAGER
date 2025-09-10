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
import Ipfs from "./Ipfs";
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
      element: <SystemInfo />
    },
    {
      name: "Auto updates",
      subPath: subPaths.autoUpdates,
      element: <AutoUpdates />
    },
    {
      name: "App",
      subPath: subPaths.app,
      element: <App />
    },
    {
      name: "Profile",
      subPath: subPaths.profile,
      element: <Profile />
    },
    {
      name: "Power",
      subPath: subPaths.power,
      element: <PowerManagment />
    },
    {
      name: "Network",
      subPath: subPaths.network,
      element: <Network />
    },
    {
      name: "Update",
      subPath: subPaths.update,
      element: <SystemUpdate />
    },
    {
      name: "IPFS",
      subPath: subPaths.ipfs,
      element: <Ipfs />
    },
    {
      name: "Peers (legacy)",
      subPath: `${subPaths.peers}/*`, // legacy /system/add-ipfs-peer/* for backwards compatibility with old links
      element: <Ipfs />,
      hideSection: true
    },
    {
      name: "Security",
      subPath: subPaths.security,
      element: <Security />
    },
    {
      name: "Hardware",
      subPath: subPaths.hardware,
      element: <Hardware />
    },
    {
      name: "Advanced",
      subPath: subPaths.advanced,
      element: <Advanced />
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
