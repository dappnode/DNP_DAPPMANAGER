import Title from "components/Title";
import React from "react";
import {
  RouteComponentProps,
  NavLink,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import { title } from "../data";
import StakerNetwork from "./StakerNetwork";

const StakersRoot: React.FC<RouteComponentProps> = ({ match }) => {
  const stakersItems: {
    subPath: string;
    title: string;
    component: JSX.Element;
  }[] = [
    {
      subPath: "ethereum",
      title: "Ethereum",
      component: StakerNetwork({
        network: "mainnet",
        description:
          "Ethereum is an open source, Proof of Stake (PoS), distributed software platform based on blockchain technology. It has its own native cryptocurrency called Ether and a full featured programming language called Solidity for writing and executing Smart Contracts on the Ethereum Vitual Machine (EVM)."
      })
    },
    {
      subPath: "gnosis",
      title: "Gnosis chain",
      component: StakerNetwork({
        network: "gnosis",
        description:
          "Gnosis Chain is a fork of Ethereum being fully compatible with the EVM. This blockchain was built for rapid and cheap transactions. xDai is the xDai networks native token and is pegged at $1/xDai. Staked GNO tokens provide Proof of Stake protection using the consensus-layer Gnosis Beacon Chain"
      })
    },
    {
      subPath: "prater",
      title: "Prater",
      component: StakerNetwork({
        network: "prater",
        description:
          "The resulting testnet from the Prater and Göerli merge is the current Goerli/Prater long-term Ethereum testnet. Node operators can use it to test their node setups and app developers can use it to test their stack on a chain that's practically identical to Mainnet Ethereum but can be used and tested at no cost with testnet ETH (GoETH)"
      })
    }
  ];
  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {stakersItems.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={`${match.url}/${route.subPath}`}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {route.title}
            </NavLink>
          </button>
        ))}
      </div>

      <div className="section-spacing">
        <Switch>
          {stakersItems.map(route => (
            <Route key={route.subPath} path={`${match.path}/${route.subPath}`}>
              {route.component}
            </Route>
          ))}
          {/* Redirect automatically to the first route. DO NOT hardcode 
              to prevent typos and causing infinite loops */}
          <Redirect to={`${match.url}/${stakersItems[0].subPath}`} />
        </Switch>
      </div>
    </>
  );
};

export default StakersRoot;
