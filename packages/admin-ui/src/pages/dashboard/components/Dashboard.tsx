import React from "react";
// Own module
import { title } from "../data";
import ChainCard from "./ChainCard";
import { HostStats } from "./HostStats";
import "./dashboard.scss";
// Components
import SubTitle from "components/SubTitle";
import Title from "components/Title";
import { useChainData } from "hooks/chainData";

export default function Dashboard() {
  const chainData = useChainData();

  return (
    <>
      <Title title={title} />

      <SubTitle>Chains</SubTitle>
      <div className="dashboard-cards">
        {chainData.map(chain => (
          <ChainCard key={chain.dnpName} {...chain} />
        ))}
      </div>

      <SubTitle>Machine stats</SubTitle>
      <HostStats />
    </>
  );
}
