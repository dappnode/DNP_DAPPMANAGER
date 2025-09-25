import React from "react";
// Own module
import { title } from "../data";
import { ChainCards } from "./ChainCard";
import { HostStats } from "./HostStats";
import { PackageUpdates } from "./PackageUpdates";
import { MathSum } from "./MathSum";
// Components
import SubTitle from "components/SubTitle";
import Title from "components/Title";
import "./dashboard.scss";

export default function Dashboard() {
  return (
    <>
      <Title title={title} />

      <div className="dashboard-layout">
        <div className="dashboard-right">
          <SubTitle>Package updates</SubTitle>
          <PackageUpdates />
        </div>

        <div className="dashboard-left">
          <SubTitle>Chains</SubTitle>
          <ChainCards />

          <SubTitle>Machine stats</SubTitle>
          <HostStats />

          <SubTitle>Math Sum</SubTitle>
          <MathSum />
        </div>
      </div>
    </>
  );
}
