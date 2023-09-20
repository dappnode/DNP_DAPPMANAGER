import React from "react";
// Own module
import { title } from "../data";
import { ChainCards } from "./ChainCard";
import { HostStats } from "./HostStats";
import { PackageUpdates } from "./PackageUpdates";
// Components
import SubTitle from "components/SubTitle";
import Title from "components/Title";
import Modules from "./Modules";
import "./dashboard.scss";
import { ModulesContext } from "types";
export default function Dashboard({
  modulesContext
}: {
  modulesContext?: ModulesContext;
}) {
  return (
    <>
      <Title title={title} />

      <div className="dashboard-layout">
        <div className="dashboard-right">
          {modulesContext && (
            <>
              <SubTitle>Modules</SubTitle>
              <Modules modulesContext={modulesContext} />{" "}
            </>
          )}

          <SubTitle>Package updates</SubTitle>
          <PackageUpdates />
        </div>

        <div className="dashboard-left">
          <SubTitle>Chains</SubTitle>
          <ChainCards />

          <SubTitle>Machine stats</SubTitle>
          <HostStats />
        </div>
      </div>
    </>
  );
}
