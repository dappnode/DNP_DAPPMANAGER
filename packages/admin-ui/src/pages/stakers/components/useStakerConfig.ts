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
  // Launchpad
  const [showLaunchpadValidators, setShowLaunchpadValidators] = useState(false);
  const [allStakerItemsOk, setAllStakerItemsOk] = useState<boolean>(false);
  const [newExecClient, setNewExecClient] = useState<
    StakerItemOk<T, "execution">
  >();
  const [newConsClient, setNewConsClient] = useState<
    StakerItemOk<T, "consensus">
  >();
  const [newMevBoost, setNewMevBoost] = useState<
    StakerItemOk<T, "mev-boost">
  >();
  const [newEnableWeb3signer, setNewEnableWeb3signer] = useState<boolean>(
    false
  );
  const [currentStakerConfig, setCurrentStakerConfig] = useState<
    StakerConfigSet<T>
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
      const enableWeb3signer = isOkSelectedInstalledAndRunning(web3Signer);

      if (executionClient && executionClient.status === "ok")
        setNewExecClient(executionClient);
      if (consensusClient && consensusClient.status === "ok")
        setNewConsClient(consensusClient);

      if (isOkSelectedInstalledAndRunning(mevBoost) && mevBoost.status === "ok")
        setNewMevBoost(mevBoost);
      setNewEnableWeb3signer(enableWeb3signer);

      // Set the current config to be displayed in advance view
      setCurrentStakerConfig({
        network,
        executionClient:
          executionClient?.status === "ok" ? executionClient : undefined,
        consensusClient:
          consensusClient?.status === "ok" ? consensusClient : undefined,
        mevBoost:
          mevBoost?.status === "ok" && isOkSelectedInstalledAndRunning(mevBoost)
            ? mevBoost
            : undefined,
        enableWeb3signer
      });

      // set allStakerItemsOk
      setAllStakerItemsOk(
        executionClients.every(ec => ec.status === "ok") &&
          consensusClients.every(cc => cc.status === "ok") &&
          mevBoost.status === "ok" &&
          web3Signer.status === "ok"
      );
    }
  }, [currentStakerConfigReq.data, network]);

  useEffect(() => {
    if (currentStakerConfig)
      setChanges(
        getChanges({
          currentStakerConfig,
          newConsClient,
          newMevBoost,
          newEnableWeb3signer,
          newExecClient
        })
      );
  }, [
    currentStakerConfig,
    newConsClient,
    newMevBoost,
    newEnableWeb3signer,
    newExecClient
  ]);

  return {
    showLaunchpadValidators,
    setShowLaunchpadValidators,
    allStakerItemsOk,
    reqStatus,
    setReqStatus,
    newExecClient,
    setNewExecClient,
    newConsClient,
    setNewConsClient,
    newMevBoost,
    setNewMevBoost,
    newEnableWeb3signer,
    setNewEnableWeb3signer,
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
function getChanges<T extends Network>({
  currentStakerConfig,
  newConsClient,
  newMevBoost,
  newEnableWeb3signer,
  newExecClient
}: {
  currentStakerConfig: StakerConfigSet<T>;
  newExecClient: StakerItemOk<T, "execution"> | undefined;
  newConsClient?: StakerItemOk<T, "consensus">;
  newMevBoost?: StakerItemOk<T, "mev-boost">;
  newEnableWeb3signer: boolean;
}): {
  isAllowed: boolean;
  reason?: string;
  severity?: "warning" | "secondary" | "danger";
} {
  const {
    executionClient,
    consensusClient,
    mevBoost,
    enableWeb3signer
  } = currentStakerConfig;
  const isExecAndConsSelected = Boolean(newExecClient && newConsClient);
  const isExecAndConsDeSelected = Boolean(!newExecClient && !newConsClient);

  // Order and compare relays, returns true if changes were made
  const mevBoostRelaysChanged =
    (newMevBoost?.relays || []).sort().join(",") !==
    (mevBoost?.relays || []).sort().join(",");

  // Not allowed if no changes
  if (
    executionClient?.dnpName === newExecClient?.dnpName &&
    consensusClient?.dnpName === newConsClient?.dnpName &&
    mevBoost?.dnpName === newMevBoost?.dnpName &&
    !mevBoostRelaysChanged &&
    currentStakerConfig.consensusClient?.useCheckpointSync ===
      newConsClient?.useCheckpointSync &&
    enableWeb3signer === newEnableWeb3signer
  )
    return {
      isAllowed: false,
      reason: "No changes detected",
      severity: "secondary"
    };

  // Not allowed if changes AND (EC AND CC are deselected) AND (changes in signer or MEV boost)
  if (isExecAndConsDeSelected && (newEnableWeb3signer || newMevBoost))
    return {
      isAllowed: false,
      reason:
        "MEV Boost and/or Web3Signer selected but no consensus and execution client selected",
      severity: "warning"
    };

  // Not allowed if changes AND (EC or CC are deselected) AND (signer or mev boost)
  if (!isExecAndConsSelected && (newEnableWeb3signer || newMevBoost))
    return {
      isAllowed: false,
      reason:
        "To enable web3signer and/or MEV boost, execution and consensus clients must be selected",
      severity: "warning"
    };

  // Not allowed if changes AND (EC or CC are deselected) AND (no signer or no mev boost)
  if (newMevBoost && newMevBoost.relays?.length === 0)
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
