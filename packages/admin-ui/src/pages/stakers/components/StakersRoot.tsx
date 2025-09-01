import Title from "components/Title";
import React from "react";
import { title } from "../data";
import StakerNetwork from "./StakerNetwork";
import { Network } from "@dappnode/types";
import Optimism from "pages/rollups/components/Optimism";
import { RouteType } from "types";
import { SectionNavigator } from "components/SectionNavigator";

const StakersRoot: React.FC = () => {
  const availableRoutes: RouteType[] = [
    {
      subPath: "ethereum",
      name: "Ethereum",
      element: (
        <StakerNetwork
          network={Network.Mainnet}
          description="Ethereum is a decentralized, permissionless blockchain platform that employs a proof-of-stake (PoS) consensus mechanism, where validators stake Ether (ETH, native token of Ethereum) to secure the network and validate transactions in exchange for ETH rewards. This approach enhances network security and energy efficiency while also supporting the development and execution of smart contracts enabling robust decentralized applications (dApps) creating endless opportunities in its open-source ecosystem."
        />
      )
    },
    {
      subPath: "gnosis",
      name: "Gnosis Chain",
      element: (
        <StakerNetwork
          network={Network.Gnosis}
          description="The Gnosis Chain Network is a highly efficient, Ethereum-compatible blockchain that emphasizes security, low transaction costs, and fast execution speeds, catering primarily to decentralized finance (DeFi) applications and prediction markets. Leveraging a unique proof-of-stake consensus mechanism, it enables developers to build scalable dApps, fostering innovation and accessibility within the broader blockchain ecosystem."
        />
      )
    },
    {
      subPath: "holesky",
      name: "Holesky",
      element: (
        <StakerNetwork
          network={Network.Holesky}
          description="Holesky is one Ethereum testnet which has replaced Goerli as a staking, infrastructure, and protocol-developer testnet. This network is primarily focused on testing the Ethereum protocol in a Post-Merged environment, best reflecting the latest iteration of the Ethereum Mainnet chain."
        />
      )
    },
    {
      subPath: "hoodi",
      name: "Hoodi",
      element: (
        <StakerNetwork
          network={Network.Hoodi}
          description="Hoodi is the latest public Ethereum testnet introduced to support the Pectra upgrade, addressing challenges faced on Holesky and Sepolia. This network focuses on testing Ethereum Improvement Proposals (EIPs), staking mechanisms, and wallet interactions in a post-merge environment, ensuring a smooth transition for future mainnet updates."
        />
      )
    },
    {
      subPath: "prater",
      name: "Prater",
      element: (
        <StakerNetwork
          network={Network.Prater}
          description="Göerli, the proper name for the resulting testnet created from the Prater and Göerli merge, is the long-standing Ethereum testnet. Node operators can use it to test their node setups and app developers to test their stack before deploying to the Mainnet.  It has since been replaced by the Holesky Testnet that was launched in a merged state and did not need to merge EL and CL layers as was done in Göerli"
        />
      )
    },
    {
      subPath: "lukso",
      name: "LUKSO",
      element: (
        <StakerNetwork
          network={Network.Lukso}
          description="The LUKSO Blockchain is a next-gen, Ethereum-based platform designed specifically for the fashion, gaming, design, and social media industries, focusing on creating a new digital lifestyle space. It introduces standards for digital certificates of authenticity and ownership, enabling the development of unique digital identities, assets, and experiences through blockchain technology."
        />
      )
    },
    {
      subPath: "optimism",
      name: "Optimism",
      element: (
        <Optimism description="Optimism is a Layer 2= solution for Ethereum. Rather than operating as an independent EVM chain, Optimism executes transactions off-chain and posts compressed data to Ethereum" />
      )
    }
  ];

  // Remove the "Prater" tab from the stakersItems array
  const filteredStakersRoutes = availableRoutes.filter((item) => item.subPath !== "prater");

  return (
    <>
      <Title title={title} />
      <SectionNavigator routes={filteredStakersRoutes} />
    </>
  );
};

export default StakersRoot;
