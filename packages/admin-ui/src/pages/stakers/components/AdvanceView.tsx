import React from "react";
import { Network, StakerConfigSet } from "common";
import { BsArrowRight } from "react-icons/bs";
import "./advance-view.scss";
import { prettyDnpName } from "utils/format";

export default function AdvanceView<T extends Network>({
  currentStakerConfig,
  newStakerConfig,
  defaultGraffiti,
  defaultFeeRecipient,
  defaultCheckpointSync
}: {
  currentStakerConfig: StakerConfigSet<T>;
  newStakerConfig: StakerConfigSet<T>;
  defaultGraffiti: string;
  defaultFeeRecipient: string;
  defaultCheckpointSync: string;
}) {
  const consClientGraffiti = currentStakerConfig.consensusClient?.graffiti;
  const newConstClientGraffiti =
    newStakerConfig.consensusClient?.graffiti || defaultGraffiti;
  const consClientFeeRecipient =
    currentStakerConfig.consensusClient?.feeRecipient;
  const newConstClientFeeRecipient =
    newStakerConfig.consensusClient?.feeRecipient || defaultFeeRecipient;
  const consClientCheckpointSync =
    currentStakerConfig.consensusClient?.checkpointSync;
  const newConstClientCheckpointSync =
    newStakerConfig.consensusClient?.checkpointSync || defaultCheckpointSync;

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
      current: currentStakerConfig.mevBoost?.dnpName ? "enabled" : "disabled",
      new: newStakerConfig.mevBoost?.dnpName ? "enabled" : "disabled"
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
