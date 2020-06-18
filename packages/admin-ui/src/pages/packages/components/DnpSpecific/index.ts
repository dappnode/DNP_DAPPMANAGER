import React from "react";
// Dedicated Components
import DappmanagerDnpDappnodeEth from "./DappmanagerDnpDappnodeEth";
import { PackageContainer } from "common/types";

export const dnpSpecific: {
  [dnpName: string]: React.FC<{ dnp: PackageContainer }>;
} = {
  "dappmanager.dnp.dappnode.eth": DappmanagerDnpDappnodeEth
};

export const dnpSpecificList: { [dnpName: string]: string } = {
  "dappmanager.dnp.dappnode.eth": "Clean cache"
};
