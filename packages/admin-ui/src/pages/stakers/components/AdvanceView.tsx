import React from "react";
import { Network, StakerConfigSet } from "common";
import { BsArrowRight } from "react-icons/bs";
import "./advance-view.scss";
import { prettyDnpName } from "utils/format";

export default function AdvanceView<T extends Network>({
  currentStakerConfig,
  newStakerConfig,
  defaultCheckpointSync,
  defaultGraffiti,
  defaultFeeRecipient
}: {
  currentStakerConfig: StakerConfigSet<T>;
  newStakerConfig: StakerConfigSet<T>;
  defaultCheckpointSync: string;
  defaultGraffiti: string;
  defaultFeeRecipient: string;
}) {
  const consClientGraffiti = currentStakerConfig.graffiti;
  const newConstClientGraffiti = newStakerConfig.graffiti || defaultGraffiti;
  const consClientFeeRecipient = currentStakerConfig.feeRecipient;
  const newConstClientFeeRecipient =
    newStakerConfig.feeRecipient || defaultFeeRecipient;
  const consClientCheckpointSync = currentStakerConfig.checkpointSync;
  const newConstClientCheckpointSync =
    newStakerConfig.checkpointSync || defaultCheckpointSync;

  const stakerConfig = [
    {
      name: "Execution Client",
      current: currentStakerConfig.executionClient
        ? prettyDnpName(currentStakerConfig.executionClient.dnpName)
        : "-",
      new: newStakerConfig.executionClient
        ? prettyDnpName(newStakerConfig.executionClient.dnpName)
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
              {config.current !== config.new ? (
                <strong>{config.name}</strong>
              ) : (
                config.name
              )}
            </span>
          </span>
          <span className="current">
            <span>
              {config.current !== config.new ? (
                <strong>{config.current}</strong>
              ) : (
                config.current
              )}
            </span>
          </span>
          <span className="arrow">
            <BsArrowRight />
          </span>
          <span className="new">
            <span>
              {config.new !== config.current ? (
                <strong>{config.new}</strong>
              ) : (
                config.new
              )}
            </span>
          </span>
        </React.Fragment>
      ))}

      <br />
    </div>
  );
}
