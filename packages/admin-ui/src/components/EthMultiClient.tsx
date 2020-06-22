import React from "react";
import Card from "components/Card";
import "./ethMultiClient.scss";
import { joinCssClass } from "utils/css";
import Select from "components/Select";
import {
  EthClientTarget,
  EthClientFallback,
  EthClientStatus,
  EthClientStatusError
} from "types";
import { AiFillSafetyCertificate, AiFillClockCircle } from "react-icons/ai";
import { FaDatabase } from "react-icons/fa";
import Switch from "./Switch";
import Alert from "react-bootstrap/Alert";

export const fallbackToBoolean = (fallback: EthClientFallback): boolean =>
  fallback === "on" ? true : fallback === "off" ? false : false;
export const booleanToFallback = (bool: boolean): EthClientFallback =>
  bool ? "on" : "off";

export function getEthClientPrettyName(target: EthClientTarget): string {
  switch (target) {
    case "remote":
      return "Remote";
    case "geth-light":
      return "Geth light client";
    case "geth":
      return "Geth";
    case "openethereum":
      return "OpenEthereum";
    case "nethermind":
      return "Nethermind";
  }
}

/**
 * Get client type from a target
 */
export function getEthClientType(target: EthClientTarget): string {
  switch (target) {
    case "remote":
      return "Remote";
    case "geth-light":
      return "Light client";
    case "geth":
    case "openethereum":
    case "nethermind":
      return "Full node";
  }
}

export function getEthClientPrettyStatusError(
  statusError: EthClientStatusError
): string {
  switch (statusError.code) {
    case "UNKNOWN_ERROR":
      return `unknown error: ${(statusError.error || {}).message}`;

    case "STATE_NOT_SYNCED":
      return "state is not synced";

    case "STATE_CALL_ERROR":
      return `state call error: ${(statusError.error || {}).message}`;

    case "IS_SYNCING":
      return "is syncing";

    case "NOT_AVAILABLE":
      return `not available: ${(statusError.error || {}).message}`;

    case "NOT_RUNNING":
      return "not running";

    case "NOT_INSTALLED":
      return "not installed";

    case "INSTALLING":
      return "is installing";

    case "INSTALLING_ERROR":
      return `install error: ${(statusError.error || {}).message}`;

    case "UNINSTALLED":
      return `client package has been removed`;
  }
}

export function getEthClientPrettyStatus(
  status: EthClientStatus | null | undefined,
  fallback: EthClientFallback | null | undefined
): string {
  if (!status) return "";

  if (status.ok) return "Active";

  const message = getEthClientPrettyStatusError(status);
  const fallbackOn = fallback && fallback === "on";
  return `Not available ${fallbackOn ? "(using remote)" : ""} - ${message}`;
}

const clients: EthClientData[] = [
  {
    title: "Remote",
    description: "Public node API mantained by DAppNode",
    options: ["remote"],
    stats: {
      syncTime: "Instant",
      requirements: "No requirements",
      trust: "Centralized trust"
    },
    highlight: "syncTime"
  },
  {
    title: "Light client",
    description: "Lightweight client for low-resource devices",
    options: ["geth-light"],
    stats: {
      syncTime: "Fast sync",
      requirements: "Light requirements",
      trust: "Semi-decentralized"
    },
    highlight: "requirements"
  },
  {
    title: "Full node",
    description: "Your own Ethereum node w/out 3rd parties",
    options: ["geth", "openethereum", "nethermind"],
    stats: {
      syncTime: "Slow sync",
      requirements: "High requirements",
      trust: "Fully decentralized"
    },
    highlight: "trust"
  }
];

interface EthClientData {
  title: string;
  description: string;
  options: EthClientTarget[];
  stats: EthClientDataStats;
  highlight: keyof EthClientDataStats;
}
interface EthClientDataStats {
  syncTime: string;
  requirements: string;
  trust: string;
}

interface OptionsMap {
  [name: string]: EthClientTarget;
}

/**
 * Utility to pretty names to the actual target of that option
 * @param options
 */
function getOptionsMap(options?: EthClientTarget[]): OptionsMap {
  return options
    ? options.reduce((optMap: { [name: string]: EthClientTarget }, target) => {
        optMap[getEthClientPrettyName(target)] = target;
        return optMap;
      }, {})
    : {};
}

/**
 * View to chose or change the Eth multi-client
 * There are three main options:
 * - Remote
 * - Light client
 * - Full node
 * There may be multiple available light-clients and fullnodes
 */
function EthMultiClients({
  target: selectedTarget,
  onTargetChange,
  showStats
}: {
  target: EthClientTarget | null;
  onTargetChange: (newTarget: EthClientTarget) => void;
  showStats?: boolean;
}) {
  return (
    <div className="eth-multi-clients">
      {clients
        .filter(({ options }) => options.length > 0)
        .map(({ title, description, options, stats, highlight }) => {
          const defaultTarget = options[0];
          const selected = selectedTarget && options.includes(selectedTarget);
          const optionMap = getOptionsMap(options);
          const getSvgClass = (_highlight: keyof EthClientDataStats) =>
            joinCssClass({ active: highlight === _highlight });
          return (
            <Card
              key={defaultTarget}
              shadow
              className={`eth-multi-client ${joinCssClass({ selected })}`}
              onClick={() => {
                // Prevent over-riding the options onTargetChange call
                if (!selected) onTargetChange(defaultTarget);
              }}
            >
              <div className="title">{title}</div>
              <div className="description">{description}</div>

              {showStats && <hr></hr>}
              {showStats && (
                <div className="eth-multi-client-stats">
                  <AiFillClockCircle className={getSvgClass("syncTime")} />
                  <FaDatabase className={getSvgClass("requirements")} />
                  <AiFillSafetyCertificate className={getSvgClass("trust")} />
                  <div className="tag">{stats.syncTime}</div>
                  <div className="tag">{stats.requirements}</div>
                  <div className="tag">{stats.trust}</div>
                </div>
              )}

              {selected && options.length > 1 && (
                <Select
                  value={
                    selectedTarget
                      ? getEthClientPrettyName(selectedTarget)
                      : undefined
                  }
                  options={options.map(getEthClientPrettyName)}
                  onValueChange={(newOpt: string) => {
                    onTargetChange(optionMap[newOpt]);
                  }}
                ></Select>
              )}
            </Card>
          );
        })}
    </div>
  );
}

/**
 * View and toggle using the fallback when using a non-remote eth multi client
 * This component should be used with EthMultiClients
 */
function EthMultiClientFallback({
  target,
  fallback,
  onFallbackChange
}: {
  target: EthClientTarget | null;
  fallback: EthClientFallback;
  onFallbackChange: (newFallback: EthClientFallback) => void;
}) {
  // Do not render for remote
  if (!target || target === "remote") return null;

  return (
    <Switch
      className="eth-multi-clients-fallback"
      checked={fallbackToBoolean(fallback)}
      onToggle={bool => onFallbackChange(booleanToFallback(bool))}
      label="Use remote during syncing or errors"
      id="eth-multi-clients-fallback-switch"
    />
  );
}

/**
 * View to chose or change the Eth multi-client, plus choose to use a fallback
 * There are three main options:
 * - Remote
 * - Light client
 * - Full node
 * There may be multiple available light-clients and fullnodes
 */
export function EthMultiClientsAndFallback({
  target,
  onTargetChange,
  showStats,
  fallback,
  onFallbackChange
}: {
  target: EthClientTarget | null;
  onTargetChange: (newTarget: EthClientTarget) => void;
  showStats?: boolean;
  fallback: EthClientFallback;
  onFallbackChange: (newFallback: EthClientFallback) => void;
}) {
  return (
    <div className="eth-multi-clients-and-fallback">
      <EthMultiClients
        target={target}
        onTargetChange={onTargetChange}
        showStats={showStats}
      />

      <EthMultiClientFallback
        target={target}
        fallback={fallback}
        onFallbackChange={onFallbackChange}
      />

      {target && target !== "remote" && fallback === "off" && (
        <Alert variant="warning">
          If your node is not available, you won't be able to update packages or
          access the DAppStore.
        </Alert>
      )}
    </div>
  );
}
