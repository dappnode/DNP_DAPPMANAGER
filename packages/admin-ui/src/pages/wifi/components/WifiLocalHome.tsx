import React from "react";
// Own module
import { title, subPaths } from "../data";
// Components
import Title from "components/Title";
import { SectionNavigator } from "components/SectionNavigator";
import WifiHome from "./wifi/WifiHome";
import { LocalProxying } from "./localProxying/LocalProxying";
import { RouteType } from "types";
// CSS
import "./wifiLocal.scss";

export const WifiLocalHome: React.FC = () => {
  const availableRoutes: RouteType[] = [
    {
      name: "Wi-Fi",
      subPath: subPaths.wifi,
      element: <WifiHome />
    },
    {
      name: "Local Network",
      subPath: subPaths.local,
      element: <LocalProxying />
    }
  ];

  return (
    <>
      <Title title={title} />
      <SectionNavigator routes={availableRoutes} />
    </>
  );
};
