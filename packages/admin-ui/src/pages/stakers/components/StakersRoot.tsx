import Title from "components/Title";
import React, { useEffect } from "react";
import {
  NavLink,
  Routes,
  Route,
  useNavigate
} from "react-router-dom";
import { title } from "../data";
import StakerNetwork from "./StakerNetwork";

const StakersRoot: React.FC = () => {
  const navigate = useNavigate();
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
            "Ethereum is an open source, distributed software platform that is based on blockchain technology. It has its own native cryptocurrency called Ether and a programming language called Solidity."
        })
      },
      {
        subPath: "gnosis",
        title: "Gnosis chain",
        component: StakerNetwork({
          network: "gnosis",
          description:
            "Gnosis Chain is a reliable payments EVM blockchain built for rapid and cheap transactions. xDai is a stable token. GNO will provide Proof of Stake protection using the consensus-layer Gnosis Beacon Chain"
        })
      },
      {
        subPath: "prater",
        title: "Prater",
        component: StakerNetwork({
          network: "prater",
          description:
            "The resulting testnet from the Prater and Göerli merge is the long-standing Ethereum testnet. Node operators can use it to test their node setups and app developers to test their stack"
        })
      }
    ];

  // Redirect automatically to the first route. DO NOT hardcode
  // to prevent typos and causing infinite loops 
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    navigate(`${stakersItems[0].subPath}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {stakersItems.map(route => (
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
            <Route key={route.subPath} path={route.subPath}>
              {route.component}
            </Route>
          ))}
        </Routes>
      </div>
    </>
  );
};

export default StakersRoot;
