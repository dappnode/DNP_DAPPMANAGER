import React from "react";
import { StakerConfigSet } from "common";
import { BsArrowRight } from "react-icons/bs";
import "./advance-view.scss";
import { prettyDnpName } from "utils/format";

export default function AdvanceView({
  currentStakerConfig,
  newStakerConfig
}: {
  currentStakerConfig: StakerConfigSet;
  newStakerConfig: StakerConfigSet;
}) {
  const consClientGraffiti = currentStakerConfig.consensusClient?.graffiti;
  const newConstClientGraffiti = newStakerConfig.consensusClient?.graffiti;
  const consClientFeeRecipient =
    currentStakerConfig.consensusClient?.feeRecipient;
  const newConstClientFeeRecipient =
    newStakerConfig.consensusClient?.feeRecipient;
  const consClientCheckpointSync =
    currentStakerConfig.consensusClient?.checkpointSync;
  const newConstClientCheckpointSync =
    newStakerConfig.consensusClient?.checkpointSync;

  const stakerConfig = [
    {
      name: "Execution Client",
      current: currentStakerConfig.executionClient
        ? prettyDnpName(currentStakerConfig.executionClient)
        : "-",
      new: newStakerConfig.executionClient
        ? prettyDnpName(newStakerConfig.executionClient)
        : "-"
    },
    {
      name: "Consensus Client",
      current: currentStakerConfig.consensusClient
        ? prettyDnpName(currentStakerConfig.consensusClient.dnpName)
        : "-",
      new: newStakerConfig.consensusClient
        ? prettyDnpName(newStakerConfig.consensusClient.dnpName)
        : "-"
    },
    {
      name: "Graffiti",
      current: consClientGraffiti ? consClientGraffiti : "-",
      new: newConstClientGraffiti ? newConstClientGraffiti : "-"
    },
    {
      name: "Fee Recipient",
      current: consClientFeeRecipient ? consClientFeeRecipient : "-",
      new: newConstClientFeeRecipient ? newConstClientFeeRecipient : "-"
    },
    {
      name: "Checkpoint Sync",
      current: consClientCheckpointSync ? consClientCheckpointSync : "-",
      new: newConstClientCheckpointSync ? newConstClientCheckpointSync : "-"
    },
    {
      name: "Checkpoint Sync",
      current: consClientCheckpointSync ? consClientCheckpointSync : "-",
      new: newConstClientCheckpointSync ? newConstClientCheckpointSync : "-"
    },
    {
      name: "Web3 Signer",
      current: currentStakerConfig.enableWeb3signer ? "enabled" : "disabled",
      new: newStakerConfig.enableWeb3signer ? "enabled" : "disabled"
    },
    {
      name: "Mev Boost",
      current: currentStakerConfig.enableMevBoost ? "enabled" : "disabled",
      new: newStakerConfig.enableMevBoost ? "enabled" : "disabled"
    }
  ];
  return (
    <div className="list-grid staker-advance-view">
      {/* Table header */}
      <header>CONFIG</header>
      <header>CURRENT</header>
      <header />
      <header>NEW</header>

      <hr />

      {stakerConfig.map((config, i) => (
        <React.Fragment key={i}>
          <span className="config">
            <span>
              <strong>{config.name}</strong>
            </span>
          </span>
          <span className="current">
            <span>{config.current}</span>
          </span>
          <span className="arrow">
            <BsArrowRight />
          </span>
          <span className="new">
            <span>{config.new}</span>
          </span>
        </React.Fragment>
      ))}

      <br />
    </div>
  );
}
