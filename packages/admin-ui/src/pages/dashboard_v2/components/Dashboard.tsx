import React from "react";
// Own module
import { ChainCards } from "./ChainCard";
// Components
import SubTitle from "components/SubTitle";
import Title from "components/Title";
import SystemHealth from "./SystemHealth";
import NetworkStats from "./NetworkStats";
import "./dashboard.scss";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Title title="Welcome back, Node Runner" />
        <hr />
      </div>

      <SystemHealth />

      <NetworkStats />

      <div className="dashboard-layout">
        <div className="dashboard-left">
          <SubTitle>Chains</SubTitle>
          <ChainCards />
        </div>
      </div>
    </div>
  );
}
