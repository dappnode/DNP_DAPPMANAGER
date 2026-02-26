import React from "react";
// Own module
// Components
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
    </div>
  );
}
