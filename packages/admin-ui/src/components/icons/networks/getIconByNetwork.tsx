import { Network } from "@dappnode/types";
import { GnosisLogo } from "components/icons/networks/gnosisLogo";
import React from "react";
import { SiEthereum } from "react-icons/si";
import { LuksoLogo } from "./luksoLogo";

export const getIconByNetwork = (network: Network) => {
  switch (network) {
    case Network.Mainnet:
    case Network.Hoodi:
    case Network.Sepolia:
      return <SiEthereum />;
    case Network.Gnosis:
      return <GnosisLogo />;
    case Network.Lukso:
      return <LuksoLogo />;
    default:
      return null;
  }
};
