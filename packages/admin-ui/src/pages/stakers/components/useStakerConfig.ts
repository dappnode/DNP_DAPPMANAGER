import { useState, useEffect } from "react";
import { ReqStatus } from "types";
import {
  StakerConfigGet,
  StakerConfigSet,
  StakerItemOk,
  StakerType,
  StakerItem,
  Network
} from "@dappnode/types";
import { responseInterface } from "swr";

export const useStakerConfig = <T extends Network>(
  network: T,
  currentStakerConfigReq: responseInterface<StakerConfigGet<T>, Error>
) => {
  // Request status
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const [newExecClient, setNewExecClient] = useState<
    StakerItemOk<T, "execution">
  >();
  const [newConsClient, setNewConsClient] = useState<
    StakerItemOk<T, "consensus">
  >();
  const [newMevBoost, setNewMevBoost] = useState<
    StakerItemOk<T, "mev-boost">
  >();
  const [newRelays, setNewRelays] = useState<string[]>([]);
  const [newUseCheckpointSync, setNewUseCheckpointSync] = useState<boolean>(
    true
  );
  const [newWeb3signer, setNewWeb3signer] = useState<
    StakerItemOk<T, "signer">
  >();
  const [currentStakerConfig, setCurrentStakerConfig] = useState<
    StakerConfigSet
  >();
  // Changes
  const [changes, setChanges] = useState<{
    isAllowed: boolean;
    reason?: string;
    severity?: "warning" | "secondary" | "danger";
  }>({ isAllowed: false });

  useEffect(() => {
    if (currentStakerConfigReq.data) {
      const {
        executionClients,
        consensusClients,
        mevBoost,
        web3Signer
      } = currentStakerConfigReq.data;

      const executionClient = executionClients.find(ec =>
        isOkSelectedInstalledAndRunning(ec)
      );
      const consensusClient = consensusClients.find(cc =>
        isOkSelectedInstalledAndRunning(cc)
      );

      if (executionClient && executionClient.status === "ok")
        setNewExecClient(executionClient);
      if (consensusClient && consensusClient.status === "ok") {
        setNewConsClient(consensusClient);
        consensusClient.useCheckpointSync &&
          setNewUseCheckpointSync(consensusClient.useCheckpointSync);
      }

      if (
        isOkSelectedInstalledAndRunning(mevBoost) &&
        mevBoost.status === "ok"
      ) {
        setNewMevBoost(mevBoost);
        mevBoost.relays && setNewRelays(mevBoost.relays);
      }

      if (
        isOkSelectedInstalledAndRunning(web3Signer) &&
        web3Signer.status === "ok"
      )
        setNewWeb3signer(web3Signer);

      // Set the current config to be displayed in advance view
      setCurrentStakerConfig({
        network,
        executionDnpName: executionClient?.dnpName || null,
        consensusDnpName: consensusClient?.dnpName || null,
        useCheckpointSync: consensusClient?.useCheckpointSync || false,
        mevBoostDnpName: mevBoost.dnpName || null,
        relays: mevBoost.relays || [],
        web3signerDnpName: web3Signer.dnpName
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
            useCheckpointSync: newUseCheckpointSync,
            mevBoostDnpName: newMevBoost?.dnpName || null,
            relays: newRelays,
            web3signerDnpName: newWeb3signer?.dnpName || null
          }
        })
      );
  }, [
    network,
    currentStakerConfig,
    newConsClient,
    newUseCheckpointSync,
    newMevBoost,
    newRelays,
    newWeb3signer,
    newExecClient
  ]);

  return {
    reqStatus,
    setReqStatus,
    newExecClient,
    setNewExecClient,
    newConsClient,
    setNewConsClient,
    newUseCheckpointSync,
    setNewUseCheckpointSync,
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
  const {
    executionDnpName,
    consensusDnpName,
    useCheckpointSync,
    mevBoostDnpName,
    relays,
    web3signerDnpName
  } = currentStakerConfig;
  const isExecAndConsSelected = Boolean(
    newStakerConfig.executionDnpName && newStakerConfig.consensusDnpName
  );
  const isExecAndConsDeSelected = Boolean(
    !newStakerConfig.executionDnpName && !newStakerConfig.consensusDnpName
  );

  // Order and compare relays, returns true if changes were made
  const mevBoostRelaysChanged =
    relays.sort().join(",") !== newStakerConfig.relays.sort().join(",");

  // Not allowed if no changes
  if (
    executionDnpName === newStakerConfig.executionDnpName &&
    consensusDnpName === newStakerConfig.consensusDnpName &&
    mevBoostDnpName === newStakerConfig.mevBoostDnpName &&
    !mevBoostRelaysChanged &&
    useCheckpointSync === newStakerConfig.useCheckpointSync &&
    web3signerDnpName === newStakerConfig.web3signerDnpName
  )
    return {
      isAllowed: false,
      reason: "No changes detected",
      severity: "secondary"
    };

  // Not allowed if changes AND (EC AND CC are deselected) AND (changes in signer or MEV boost)
  if (isExecAndConsDeSelected && (web3signerDnpName || mevBoostDnpName))
    return {
      isAllowed: false,
      reason:
        "MEV Boost and/or Web3Signer selected but no consensus and execution client selected",
      severity: "warning"
    };

  // Not allowed if changes AND (EC or CC are deselected) AND (signer or mev boost)
  if (!isExecAndConsSelected && (web3signerDnpName || mevBoostDnpName))
    return {
      isAllowed: false,
      reason:
        "To enable web3signer and/or MEV boost, execution and consensus clients must be selected",
      severity: "warning"
    };

  // Not allowed if changes AND (EC or CC are deselected) AND (no signer or no mev boost)
  if (relays.length === 0)
    return {
      isAllowed: false,
      reason: "You must select at least one relay in the MEV boost",
      severity: "warning"
    };

  return { isAllowed: true };
}

function isOkSelectedInstalledAndRunning<
  T extends Network,
  P extends StakerType
>(StakerItem: StakerItem<T, P>): boolean {
  return (
    StakerItem.status === "ok" &&
    StakerItem.isSelected &&
    StakerItem.isInstalled &&
    StakerItem.isRunning
  );
}
