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
              "Ethereum is an open source, distributed software platform that is based on blockchain technology. It has its own native cryptocurrency called Ether and a programming language called Solidity."
          })
      },
      {
        subPath: "gnosis",
        title: "Gnosis Chain",
        component: () =>
          StakerNetwork({
            network: "gnosis",
            description:
              "Gnosis Chain is a reliable payments EVM blockchain built for rapid and cheap transactions. xDai is a stable token. GNO will provide Proof of Stake protection using the consensus-layer Gnosis Beacon Chain"
          })
      },
      {
        subPath: "holesky",
        title: "Holesky",
        component: () =>
          StakerNetwork({
            network: "holesky",
            description:
              "Holesky is a merged-from-genesis public Ethereum testnet which will replace Goerli as a staking, infrastructure, and protocol-developer testnet. This network is primarily focused on testing the Ethereum protocol."
          })
      },
      {
        subPath: "prater",
        title: "Prater",
        component: () =>
          StakerNetwork({
            network: "prater",
            description:
              "The resulting testnet from the Prater and Göerli merge is the long-standing Ethereum testnet. Node operators can use it to test their node setups and app developers to test their stack"
          })
      },
      {
        subPath: "lukso",
        title: "LUKSO",
        component: () =>
          StakerNetwork({
            network: "lukso",
            description:
              "LUKSO blockchain provides creators and users with future-proof tools and standards to unleash their creative force in an open interoperable ecosystem."
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
        {/* Render the staker tabs except for "Prater" */}
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
