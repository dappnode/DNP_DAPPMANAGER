import React from "react";
import { Network, StakerConfigSet, StakerItemOk } from "@dappnode/common";
import { BsArrowRight } from "react-icons/bs";
import { prettyDnpName } from "utils/format";
import { isEqual } from "lodash-es";
import "./advance-view.scss";
import { mapRelays, subStringifyConfig } from "./utils";

export default function AdvanceView<T extends Network>({
  currentStakerConfig,
  newExecClient,
  newConsClient,
  newMevBoost,
  newEnableWeb3signer
}: {
  currentStakerConfig: StakerConfigSet<T>;
  newExecClient: StakerItemOk<T, "execution"> | undefined;
  newConsClient: StakerItemOk<T, "consensus"> | undefined;
  newMevBoost: StakerItemOk<T, "mev-boost"> | undefined;
  newEnableWeb3signer: boolean;
}) {
  const {
    executionClient,
    consensusClient,
    mevBoost,
    enableWeb3signer
  } = currentStakerConfig;

  const stakerConfig = [
    {
      name: "Execution Client",
      current: executionClient?.dnpName
        ? prettyDnpName(executionClient.dnpName)
        : "-",
      new: newExecClient?.dnpName ? prettyDnpName(newExecClient?.dnpName) : "-"
    },
    {
      name: "Consensus Client",
      current: consensusClient?.dnpName
        ? prettyDnpName(consensusClient.dnpName)
        : "-",
      new: newConsClient?.dnpName ? prettyDnpName(newConsClient.dnpName) : "-"
    },
    {
      name: "Graffiti",
      current: consensusClient?.graffiti ? consensusClient?.graffiti : "-",
      new: newConsClient?.graffiti ? newConsClient?.graffiti : "-"
    },
    {
      name: "Fee Recipient",
      current: consensusClient?.feeRecipient
        ? consensusClient?.feeRecipient
        : "-",
      new: newConsClient?.feeRecipient ? newConsClient?.feeRecipient : "-"
    },
    {
      name: "Checkpoint Sync",
      current: consensusClient?.checkpointSync
        ? consensusClient?.checkpointSync
        : "-",
      new: newConsClient?.checkpointSync ? newConsClient?.checkpointSync : "-"
    },
    {
      name: "Web3 Signer",
      current: enableWeb3signer ? "enabled" : "disabled",
      new: newEnableWeb3signer ? "enabled" : "disabled"
    },
    {
      name: "Mev Boost",
      current: mevBoost?.dnpName ? "enabled" : "disabled",
      new: newMevBoost?.dnpName ? "enabled" : "disabled"
    },
    {
      name: "Relays",
      current: mevBoost?.relays
        ? mapRelays(currentStakerConfig.network, mevBoost.relays)
            .map(relay => relay.operator)
            .join(", ")
        : "-",
      new: newMevBoost?.relays
        ? mapRelays(currentStakerConfig.network, newMevBoost.relays)
            .map(relay => relay.operator)
            .join(", ")
        : "-"
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
              {!isEqual(config.current, config.new) ? (
                <strong>{subStringifyConfig(config.current)}</strong>
              ) : (
                subStringifyConfig(config.current)
              )}
            </span>
          </span>
          <span className="arrow">
            <BsArrowRight />
          </span>
          <span className="new">
            <span>
              {config.new !== config.current ? (
                <strong>{subStringifyConfig(config.new)}</strong>
              ) : (
                subStringifyConfig(config.new)
              )}
            </span>
          </span>
        </React.Fragment>
      ))}

      <br />
    </div>
  );
}
