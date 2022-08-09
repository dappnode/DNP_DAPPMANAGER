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
      subPath: "mainnet",
      title: "Mainnet",
      component: StakerNetwork({
        network: "mainnet",
        description: "Mainnet stakers",
        consensusClients: [
          "prysm.dnp.dappnode.eth",
          "lighthouse.dnp.dappnode.eth",
          "teku.dnp.dappnode.eth",
          "nimbus.dnp.dappnode.eth"
        ],
        executionClients: [
          "geth.dnp.dappnode.eth",
          "nethermind.dnp.dappnode.eth",
          "erigon.dnp.dappnode.eth"
        ],
        signer: "web3signer.dnp.dappnode.eth",
        mevBoost: "mev-geth.dnp.dappnode.eth"
      })
    },
    {
      subPath: "gnosis",
      title: "Gnosis chain",
      component: StakerNetwork({
        network: "gnosis",
        description: "Gnosis stakers",
        consensusClients: [
          "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
          "lighthouse-gnosis.dnp.dappnode.eth",
          "teku-gnosis.dnp.dappnode.eth"
        ],
        executionClients: ["nethermind-xdai.dnp.dappnode.eth"],
        signer: "web3signer-gnosis.dnp.dappnode.eth"
      })
    },
    {
      subPath: "prater",
      title: "Prater",
      component: StakerNetwork({
        network: "prater",
        description: "Prater stakers",
        consensusClients: [
          "prysm-prater.dnp.dappnode.eth",
          "lighthouse-prater.dnp.dappnode.eth",
          "teku-prater.dnp.dappnode.eth",
          "nimbus-prater.dnp.dappnode.eth"
        ],
        executionClients: ["goerli-geth.dnp.dappnode.eth"],
        signer: "web3signer-prater.dnp.dappnode.eth"
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
