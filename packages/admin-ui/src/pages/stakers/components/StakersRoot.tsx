import Title from "components/Title";
import React from "react";
import { NavLink, Routes, Route } from "react-router-dom";
import { title } from "../data";
import StakerNetwork from "./StakerNetwork";

const StakersRoot: React.FC = () => {
  const stakersItems: {
    subPath: string;
    title: string;
    component: () => React.JSX.Element;
  }[] = [
      {
        subPath: "ethereum",
        title: "Ethereum",
        component: () =>
          StakerNetwork({
            network: "mainnet",
            description:
              "Ethereum is a decentralized, permissionless blockchain platform that employs a proof-of-stake (PoS) consensus mechanism, where validators stake Ether (ETH, native token of Ethereum) to secure the network and validate transactions in exchange for ETH rewards. This approach enhances network security and energy efficiency while also supporting the development and execution of smart contracts enabling robust decentralized applications (dApps) creating endless opportunities in its open-source ecosystem."
          })
      },
      {
        subPath: "gnosis",
        title: "Gnosis Chain",
        component: () =>
          StakerNetwork({
            network: "gnosis",
            description:
              "The Gnosis Chain Network is a highly efficient, Ethereum-compatible blockchain that emphasizes security, low transaction costs, and fast execution speeds, catering primarily to decentralized finance (DeFi) applications and prediction markets. Leveraging a unique proof-of-stake consensus mechanism, it enables developers to build scalable dApps, fostering innovation and accessibility within the broader blockchain ecosystem."
          })
      },
      {
        subPath: "holesky",
        title: "Holesky",
        component: () =>
          StakerNetwork({
            network: "holesky",
            description:
              "Holesky is the latest public Ethereum testnet which will/has replaced Goerli as a staking, infrastructure, and protocol-developer testnet. This network is primarily focused on testing the Ethereum protocol in a Post-Merged environment, best reflecting the latest iteration of the Ethereum Mainnet chain."
          })
      },
      {
        subPath: "prater",
        title: "Prater",
        component: () =>
          StakerNetwork({
            network: "prater",
            description:
              "Göerli, the proper name for the resulting testnet created from the Prater and Göerli merge, is the long-standing Ethereum testnet. Node operators can use it to test their node setups and app developers to test their stack before deploying to the Mainnet.  It has since been replaced by the Holesky Testnet that was launched in a merged state and did not need to merge EL and CL layers as was done in Göerli"
          })
      },
      {
        subPath: "lukso",
        title: "LUKSO",
        component: () =>
          StakerNetwork({
            network: "lukso",
            description:
              "The LUKSO Blockchain is a next-gen, Ethereum-based platform designed specifically for the fashion, gaming, design, and social media industries, focusing on creating a new digital lifestyle space. It introduces standards for digital certificates of authenticity and ownership, enabling the development of unique digital identities, assets, and experiences through blockchain technology."
          })
      }
    ];

  // Remove the "Prater" tab from the stakersItems array
  const filteredStakersItems = stakersItems.filter(
    item => item.subPath !== "prater"
  );

  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {/* Render the staker tabs, excluding "Prater" which is hidden due to deprecation */}
        {filteredStakersItems.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={route.subPath}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {route.title}
            </NavLink>
          </button>
        ))}
      </div>

      <div className="section-spacing">
        <Routes>
          {stakersItems.map(route => (
            <Route
              key={route.subPath}
              path={route.subPath}
              element={<route.component />}
            />
          ))}
        </Routes>
      </div>
    </>
  );
};

export default StakersRoot;
