import { useState, useEffect } from "react";
import { ReqStatus } from "types";
import { StakerConfigGet, StakerConfigSet, StakerItemOk, StakerItem, Network } from "@dappnode/types";
import { responseInterface } from "swr";

export const useStakerConfig = <T extends Network>(
  network: T,
  currentStakerConfigReq: responseInterface<StakerConfigGet, Error>
) => {
  // Request status
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const [newExecClient, setNewExecClient] = useState<StakerItemOk | null>(null);
  const [newConsClient, setNewConsClient] = useState<StakerItemOk | null>(null);
  const [newMevBoost, setNewMevBoost] = useState<StakerItemOk | null>(null);
  const [newRelays, setNewRelays] = useState<string[]>([]);
  const [newWeb3signer, setNewWeb3signer] = useState<StakerItemOk | null>(null);
  const [currentStakerConfig, setCurrentStakerConfig] = useState<StakerConfigSet>();
  // Changes
  const [changes, setChanges] = useState<{
    isAllowed: boolean;
    reason?: string;
    severity?: "warning" | "secondary" | "danger";
  }>({ isAllowed: false });

  useEffect(() => {
    // reset new states when network changes
    setReqStatus({});
    setNewExecClient(null);
    setNewConsClient(null);
    setNewMevBoost(null);
    setNewRelays([]);
    setNewWeb3signer(null);
    setCurrentStakerConfig(undefined);
    setChanges({ isAllowed: false });

    if (currentStakerConfigReq.data) {
      const { executionClients, consensusClients, mevBoost, web3Signer } = currentStakerConfigReq.data;

      const executionClient = executionClients.find((ec) => isOkSelectedInstalledAndRunning(ec));
      const consensusClient = consensusClients.find((cc) => isOkSelectedInstalledAndRunning(cc));

      if (executionClient && executionClient.status === "ok") setNewExecClient(executionClient);
      if (consensusClient && consensusClient.status === "ok") setNewConsClient(consensusClient);

      const currentMevBoost = mevBoost && isOkSelectedInstalledAndRunning(mevBoost) ? mevBoost : null;
      if (currentMevBoost && mevBoost?.status === "ok") {
        setNewMevBoost(mevBoost);
        mevBoost.relays && setNewRelays(mevBoost.relays);
      }

      const currentWeb3signer = isOkSelectedInstalledAndRunning(web3Signer) ? web3Signer : null;
      if (currentWeb3signer && web3Signer.status === "ok") setNewWeb3signer(web3Signer);

      setCurrentStakerConfig({
        network,
        executionDnpName: executionClient?.dnpName || null,
        consensusDnpName: consensusClient?.dnpName || null,
        mevBoostDnpName: currentMevBoost?.dnpName || null,
        relays: currentMevBoost?.relays || [],
        web3signerDnpName: currentWeb3signer?.dnpName || null
      });
    }
  }, [currentStakerConfigReq.data, network]);

  useEffect(() => {
    if (currentStakerConfig)
      setChanges(
        getChanges({
          currentStakerConfig,
          newStakerConfig: {
            network,
            executionDnpName: newExecClient?.dnpName || null,
            consensusDnpName: newConsClient?.dnpName || null,
            mevBoostDnpName: newMevBoost?.dnpName || null,
            relays: newRelays,
            web3signerDnpName: newWeb3signer?.dnpName || null
          }
        })
      );
  }, [network, currentStakerConfig, newConsClient, newMevBoost, newRelays, newWeb3signer, newExecClient]);

  return {
    reqStatus,
    setReqStatus,
    newExecClient,
    setNewExecClient,
    newConsClient,
    setNewConsClient,
    newMevBoost,
    setNewMevBoost,
    newRelays,
    setNewRelays,
    newWeb3signer,
    setNewWeb3signer,
    changes
  };
};

// Utils

/**
 * Returns if the changes are allowed to be set:
 * - At leaset EC and CC must be selected or none of them
 * - Any change in:
 *   - graffiti
 *   - fee recipient
 *   - checkpoint sync
 *   - CC/EC
 *   - Signer
 *   - MEV boost
 *   - MEV boost relays
 */
function getChanges({
  currentStakerConfig,
  newStakerConfig
}: {
  currentStakerConfig: StakerConfigSet;
  newStakerConfig: StakerConfigSet;
}): {
  isAllowed: boolean;
  reason?: string;
  severity?: "warning" | "secondary" | "danger";
} {
  const { executionDnpName, consensusDnpName, mevBoostDnpName, relays, web3signerDnpName } = currentStakerConfig;
  const isExecAndConsSelected = Boolean(newStakerConfig.executionDnpName && newStakerConfig.consensusDnpName);
  const isExecAndConsDeSelected = Boolean(!newStakerConfig.executionDnpName && !newStakerConfig.consensusDnpName);

  // Order and compare relays, returns true if changes were made
  const mevBoostRelaysChanged = relays.sort().join(",") !== newStakerConfig.relays.sort().join(",");

  // Not allowed if no changes
  if (
    executionDnpName === newStakerConfig.executionDnpName &&
    consensusDnpName === newStakerConfig.consensusDnpName &&
    mevBoostDnpName === newStakerConfig.mevBoostDnpName &&
    !mevBoostRelaysChanged &&
    web3signerDnpName === newStakerConfig.web3signerDnpName
  )
    return {
      isAllowed: false,
      reason: "No changes detected",
      severity: "secondary"
    };

  // Not allowed if execution and !consensus or !execution and consensus
  // Exception: Starknet networks use full nodes (execution client only, no consensus client needed)
  const isStarknetNetwork = newStakerConfig.network === Network.StarknetMainnet || newStakerConfig.network === Network.StarknetSepolia;

  if (
    !isStarknetNetwork &&
    ((newStakerConfig.executionDnpName && !newStakerConfig.consensusDnpName) ||
      (!newStakerConfig.executionDnpName && newStakerConfig.consensusDnpName))
  )
    return {
      isAllowed: false,
      reason: "Execution and consensus clients must be selected together",
      severity: "warning"
    };

  // Not allowed if changes AND (EC AND CC are deselected) AND (changes in signer or MEV boost)
  if (isExecAndConsDeSelected && (newStakerConfig.web3signerDnpName || newStakerConfig.mevBoostDnpName))
    return {
      isAllowed: false,
      reason: "MEV Boost and/or Web3Signer selected but no consensus and execution client selected",
      severity: "warning"
    };

  // Not allowed if changes AND (EC or CC are deselected) AND (signer or mev boost)
  // Exception: Starknet networks only need execution client
  const hasRequiredClients = isStarknetNetwork
    ? Boolean(newStakerConfig.executionDnpName)
    : isExecAndConsSelected;

  if (!hasRequiredClients && (newStakerConfig.web3signerDnpName || newStakerConfig.mevBoostDnpName))
    return {
      isAllowed: false,
      reason: isStarknetNetwork
        ? "To enable web3signer and/or MEV boost, execution client must be selected"
        : "To enable web3signer and/or MEV boost, execution and consensus clients must be selected",
      severity: "warning"
    };

  // Not allowed if changes AND (EC or CC are deselected) AND (no signer or no mev boost)
  if (newStakerConfig.mevBoostDnpName && newStakerConfig.relays.length === 0)
    return {
      isAllowed: false,
      reason: "You must select at least one relay in the MEV boost",
      severity: "warning"
    };

  return { isAllowed: true };
}

function isOkSelectedInstalledAndRunning(StakerItem: StakerItem): boolean {
  return StakerItem.status === "ok" && StakerItem.isSelected && StakerItem.isInstalled && StakerItem.isRunning;
}
