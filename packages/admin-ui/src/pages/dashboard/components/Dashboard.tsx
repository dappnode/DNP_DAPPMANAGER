import React from "react";
import { useSelector } from "react-redux";
// Selectors
import { getChainData } from "services/chainData/selectors";
import { getVolumes } from "services/dappnodeStatus/selectors";
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
  const volumesData = useSelector(getVolumes);
  const dappnodeVolumes = volumesData.filter(
    v => v.name === "dncore_ipfsdnpdappnodeeth_data"
  );

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
        {dappnodeVolumes.map(volumeData => (
          <VolumeCard key={volumeData.name} volumeData={volumeData} />
        ))}
      </div>
    </>
  );
}
