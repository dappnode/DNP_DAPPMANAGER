import React from "react";
// Own module
import { ChainCards } from "./ChainCard";
import { HostStats } from "./HostStats";
// Components
import SubTitle from "components/SubTitle";
import Title from "components/Title";
import SystemHealth from "./SystemHealth";
import "./dashboard.scss";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Title title="Welcome back, Node Runner" />
        <hr />
      </div>

      <SystemHealth />

      <div className="dashboard-layout">
        <div className="dashboard-left">
          <SubTitle>Chains</SubTitle>
          <ChainCards />

          <SubTitle>Machine stats</SubTitle>
          <HostStats />
        </div>
      </div>
    </div>
  );
}
