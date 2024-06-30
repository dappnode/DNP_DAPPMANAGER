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
  ConsensusClientMainnet
} from "@dappnode/types";
import { AiFillSafetyCertificate, AiFillClockCircle } from "react-icons/ai";
import { FaDatabase } from "react-icons/fa";
import Switch from "./Switch";
import Alert from "react-bootstrap/Alert";
import { prettyDnpName } from "utils/format";
import Input from "./Input";
import { useSelector } from "react-redux";
import { getEthClientTarget } from "services/dappnodeStatus/selectors";

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

interface EthClientData {
  title: string;
  description: string;
  options:
    | "remote"
    | {
        execClients: string[];
        consClients: string[];
      };
  stats: EthClientDataStats;
  highlights: (keyof EthClientDataStats)[];
}
interface EthClientDataStats {
  syncTime: string;
  requirements: string;
  trust: string;
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
  newEthRemoteRpc,
  setNewEthRemoteRpc,
  showStats
}: {
  target: Eth2ClientTarget | null;
  onTargetChange: (newTarget: Eth2ClientTarget) => void;
  newEthRemoteRpc: string;
  setNewEthRemoteRpc: (newEthRemoteRpc: string) => void;
  showStats?: boolean;
}) {
  const ethClientTarget = useSelector(getEthClientTarget);

  const clients: EthClientData[] = [
    {
      title: "Remote",
      description: `Public node API mantained by DAppNode: https://web3.dappnode.net. Or choose your own.`,
      options: "remote",
      stats: {
        syncTime: "Instant",
        requirements: "No requirements",
        trust: "Centralized trust"
      },
      highlights: ["syncTime", "requirements"]
    },
    {
      title: "Full node",
      description: "Your own Ethereum node w/out 3rd parties",
      options: {
        execClients: [...Object.values(ExecutionClientMainnet)],
        consClients: [...Object.values(ConsensusClientMainnet)]
      },
      stats: {
        syncTime: "Fast sync",
        requirements: "High requirements",
        trust: "Fully decentralized"
      },
      highlights: ["trust", "syncTime"]
    }
  ];

  return (
    <div className="eth-multi-clients">
      {clients.map(({ title, description, options, stats, highlights }) => {
        let defaultTarget: Eth2ClientTarget;
        if (options === "remote") {
          defaultTarget = options;
        } else if (ethClientTarget && ethClientTarget !== "remote") {
          defaultTarget = {
            execClient: ethClientTarget.execClient,
            consClient: ethClientTarget.consClient
          };
        } else {
          defaultTarget = {
            execClient: options.execClients[0],
            consClient: options.consClients[0]
          };
        }

        let selected: boolean;
        if (options === "remote") {
          selected = selectedTarget === options ? true : false;
        } else {
          selected =
            selectedTarget &&
            selectedTarget !== "remote" &&
            options.execClients.includes(selectedTarget.execClient) &&
            options.consClients.includes(selectedTarget.consClient)
              ? true
              : false;
        }
        const getSvgClass = (_highlight: keyof EthClientDataStats) =>
          joinCssClass({
            active: highlights.find(highlight => highlight === _highlight)
          });
        return (
          <Card
            key={title}
            shadow
            className={`eth-multi-client ${joinCssClass({ selected })}`}
            onClick={() => {
              // Prevent over-riding the options onTargetChange call
              if (!selected) onTargetChange(defaultTarget);
            }}
          >
            <div className="title">{title}</div>
            <div className="description">{description}</div>

            {options === "remote" && (
              <Input
                placeholder="https://web3.dappnode.net"
                value={newEthRemoteRpc}
                onValueChange={setNewEthRemoteRpc}
              />
            )}

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

            {selected &&
              selectedTarget &&
              selectedTarget !== "remote" &&
              options !== "remote" && (
                <>
                  <Select
                    value={
                      selectedTarget && prettyDnpName(selectedTarget.execClient)
                    }
                    options={options.execClients
                      .filter(Boolean)
                      .map(prettyDnpName)}
                    onValueChange={(newOpt: string) => {
                      const newEc = Object.values(ExecutionClientMainnet).find(
                        ec => prettyDnpName(ec) === newOpt
                      );
                      if (newEc) {
                        onTargetChange({
                          ...(selectedTarget || {}),
                          execClient: newEc
                        });
                      }
                    }}
                    prepend="Execution client"
                  />

                  <Select
                    value={
                      selectedTarget && prettyDnpName(selectedTarget.consClient)
                    }
                    options={options.consClients
                      .filter(Boolean)
                      .map(prettyDnpName)}
                    onValueChange={(newOpt: string) => {
                      const newCc = Object.values(ConsensusClientMainnet).find(
                        ec => prettyDnpName(ec) === newOpt
                      );
                      if (newCc) {
                        onTargetChange({
                          ...(selectedTarget || {}),
                          consClient: newCc
                        });
                      }
                    }}
                    prepend="Consensus client"
                  />
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
  newEthRemoteRpc,
  setNewEthRemoteRpc,
  showStats,
  fallback,
  onFallbackChange
}: {
  target: Eth2ClientTarget | null;
  onTargetChange: (newTarget: Eth2ClientTarget) => void;
  newEthRemoteRpc: string;
  setNewEthRemoteRpc: (newEthRemoteRpc: string) => void;
  showStats?: boolean;
  fallback: EthClientFallback;
  onFallbackChange: (newFallback: EthClientFallback) => void;
}) {
  return (
    <div className="eth-multi-clients-and-fallback">
      <EthMultiClients
        target={target}
        onTargetChange={onTargetChange}
        newEthRemoteRpc={newEthRemoteRpc}
        setNewEthRemoteRpc={setNewEthRemoteRpc}
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
