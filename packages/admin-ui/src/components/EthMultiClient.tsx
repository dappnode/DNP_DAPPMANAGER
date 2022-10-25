import React from "react";
import Card from "components/Card";
import "./multiClient.scss";
import { joinCssClass } from "utils/css";
import Select from "components/Select";
import {
  EthClientFallback,
  EthClientStatus,
  EthClientStatusError,
  Eth2ClientTarget,
  ExecutionClientMainnet,
  ConsensusClientMainnet,
  executionClientsMainnet,
  consensusClientsMainnet
} from "types";
import { AiFillSafetyCertificate, AiFillClockCircle } from "react-icons/ai";
import { FaDatabase } from "react-icons/fa";
import Switch from "./Switch";
import Alert from "react-bootstrap/Alert";
import { prettyDnpName } from "utils/format";

export const fallbackToBoolean = (fallback: EthClientFallback): boolean =>
  fallback === "on" ? true : fallback === "off" ? false : false;
export const booleanToFallback = (bool: boolean): EthClientFallback =>
  bool ? "on" : "off";

/**
 * Get client type from a target
 */
export function getEthClientType(target: Eth2ClientTarget): string {
  switch (target) {
    case "remote":
      return "Remote";
    default:
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
    options: "remote",
    stats: {
      syncTime: "Instant",
      requirements: "No requirements",
      trust: "Centralized trust"
    },
    highlight: "syncTime"
  },
  {
    title: "Full node",
    description: "Your own Ethereum node w/out 3rd parties",
    options: {
      execClients: [...executionClientsMainnet],
      consClients: [...consensusClientsMainnet]
    },
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
  options:
    | "remote"
    | {
        execClients: ExecutionClientMainnet[];
        consClients: ConsensusClientMainnet[];
      };
  stats: EthClientDataStats;
  highlight: keyof EthClientDataStats;
}
interface EthClientDataStats {
  syncTime: string;
  requirements: string;
  trust: string;
}

interface OptionsMap {
  [name: string]: Eth2ClientTarget;
}

/**
 * Utility to pretty names to the actual target of that option
 */
function getOptionsMap(options?: Eth2ClientTarget[]): OptionsMap {
  return options
    ? options.reduce((optMap: { [name: string]: Eth2ClientTarget }, target) => {
        optMap[prettyDnpName(target)] = target;
        return optMap;
      }, {})
    : {};
}

/**
 * View to chose or change the Eth multi-client
 * There are three main options:
 * - Remote
 * - Full node
 * There may be multiple available light-clients and fullnodes
 */
function EthMultiClients({
  target: selectedTarget,
  onTargetChange,
  showStats
}: {
  target: Eth2ClientTarget | null;
  onTargetChange: (newTarget: Eth2ClientTarget) => void;
  showStats?: boolean;
}) {
  return (
    <div className="eth-multi-clients">
      {clients.map(({ title, description, options, stats, highlight }) => {
        let _defaultTarget: Eth2ClientTarget;
        let _selected: boolean;
        if (typeof options === "object" && typeof selectedTarget === "object") {
          _defaultTarget = {
            execClient: options.execClients[0],
            consClient: options.consClients[0]
          };
          _selected =
            selectedTarget &&
            selectedTarget.execClient === _defaultTarget.execClient &&
            selectedTarget.consClient === _defaultTarget.consClient
              ? true
              : false;
        } else {
          _defaultTarget = options;
          _selected =
            selectedTarget && selectedTarget === options ? true : false;
        }
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
              <>
                <Select
                  value={
                    selectedTarget ? prettyDnpName(selectedTarget) : undefined
                  }
                  options={options.map(prettyDnpName)}
                  onValueChange={(newOpt: string) => {
                    onTargetChange(optionMap[newOpt]);
                  }}
                ></Select>
              </>
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
  target: Eth2ClientTarget | null;
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
  target: Eth2ClientTarget | null;
  onTargetChange: (newTarget: Eth2ClientTarget) => void;
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
