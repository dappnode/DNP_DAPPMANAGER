import React from "react";
import { StakerConfigSet } from "common";
import { BsArrowRight } from "react-icons/bs";

export default function AdvanceView({
  currentStakerConfig,
  newStakerConfig
}: {
  currentStakerConfig: StakerConfigSet;
  newStakerConfig: StakerConfigSet;
}) {
  const stakerConfig = [
    {
      name: "Execution Client",
      current: currentStakerConfig.executionClient,
      new: newStakerConfig.executionClient
    },
    {
      name: "Consensus Client",
      current: currentStakerConfig.consensusClient,
      new: newStakerConfig.consensusClient
    },
    {
      name: "Graffiti",
      current: currentStakerConfig.graffiti,
      new: newStakerConfig.graffiti
    },
    {
      name: "Fee Recipient",
      current: currentStakerConfig.feeRecipient,
      new: newStakerConfig.feeRecipient
    },
    {
      name: "Web3 Signer",
      current: currentStakerConfig.installWeb3signer,
      new: newStakerConfig.installWeb3signer
    },
    {
      name: "Mev Boost",
      current: currentStakerConfig.installMevBoost,
      new: newStakerConfig.installMevBoost
    }
  ];
  return (
    <>
      <div className="list-grid system-network-mappings">
        {/* Table header */}
        <header>CONFIG</header>
        <header>CURRENT</header>
        <header />
        <header>NEW</header>

        <hr />

        {stakerConfig.map((config, i) => (
          <React.Fragment key={i}>
            <span className="config">{config.name}</span>
            <span className="current">{config.current}</span>
            <span className="arrow">
              <BsArrowRight />
            </span>
            <span className="new">{config.new}</span>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
