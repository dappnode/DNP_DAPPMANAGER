import React from "react";
import Eth from "./Eth";
import Ipfs from "./Ipfs";
import { subPaths, title } from "../data";
import Title from "components/Title";
import { SectionNavigator } from "components/SectionNavigator";
import { RouteType } from "types";

export const Repository: React.FC = () => {
  const availableRoutes: RouteType[] = [
    {
      name: "Ethereum",
      subPath: subPaths.eth,
      component: Eth
    },
    {
      name: "IPFS",
      subPath: subPaths.ipfs,
      component: Ipfs
    }
  ];

  return (
    <>
      <Title title={title} />
      <SectionNavigator routes={availableRoutes} />
    </>
  );
};
