import React from "react";
import { useSelector } from "react-redux";
// Selectors
import { getDappnodeVolumes } from "services/dnpInstalled/selectors";
import { getChainData } from "services/chainData/selectors";
// Own module
import { title } from "../data";
import ChainCard from "./ChainCard";
import { HostStats } from "./HostStats";
import VolumeCard from "./VolumeCard";
import "./dashboard.scss";
// Components
import SubTitle from "components/SubTitle";
import Title from "components/Title";

export default function Dashboard() {
  const chainData = useSelector(getChainData);
  const dappnodeVolumes = useSelector(getDappnodeVolumes);

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

      <SubTitle>Volumes</SubTitle>
      <div className="dashboard-cards">
        {dappnodeVolumes.map(vol => (
          <VolumeCard key={vol.name} {...vol} />
        ))}
      </div>
    </>
  );
}
