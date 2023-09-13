import { useState, useEffect } from "react";
import { ReqStatus } from "types";
import {
  OptimismConfigGet,
  OptimismConfigSet,
  OptimismItemOk,
  OptimismType,
  OptimismItem
} from "@dappnode/common";
import { responseInterface } from "swr";

export const useOptimismConfig = (
  currentOptimismConfigReq: responseInterface<OptimismConfigGet, Error>
) => {
  // Request status
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  // Error
  const [ethRpcUrlError, setEthRpcUrlError] = useState<string | null>(null);
  // New config
  const [newExecClient, setNewExecClient] = useState<
    OptimismItemOk<"execution">
  >();
  const [newRollup, setNewRollup] = useState<OptimismItemOk<"rollup">>();
  const [newArchive, setNewArchive] = useState<OptimismItemOk<"archive">>();
  const [currentOptimismConfig, setCurrentOptimismConfig] = useState<
    OptimismConfigSet
  >();
  // Changes
  const [changes, setChanges] = useState<{
    isAllowed: boolean;
    reason?: string;
    severity?: "warning" | "secondary" | "danger";
  }>({ isAllowed: false });

  useEffect(() => {
    if (currentOptimismConfigReq.data) {
      const {
        executionClients,
        rollup,
        archive
      } = currentOptimismConfigReq.data;

      const executionClient = executionClients.find(ec =>
        isOkSelectedInstalledAndRunning(ec)
      );

      if (executionClient && executionClient.status === "ok")
        setNewExecClient(executionClient);

      if (isOkSelectedInstalledAndRunning(rollup) && rollup.status === "ok")
        setNewRollup(rollup);

      if (isOkSelectedInstalledAndRunning(archive) && archive.status === "ok")
        setNewArchive(archive);

      // Set the current config to be displayed in advance view
      setCurrentOptimismConfig({
        executionClient:
          executionClient?.status === "ok" ? executionClient : undefined,
        rollup: rollup?.status === "ok" ? rollup : undefined,
        archive: archive?.status === "ok" ? archive : undefined
      });
    }
  }, [currentOptimismConfigReq.data]);

  useEffect(() => {
    if (currentOptimismConfig)
      setChanges(
        getChanges({
          currentOptimismConfig,
          newExecClient,
          newRollup,
          newArchive,
          ethRpcUrlError
        })
      );
  }, [
    currentOptimismConfig,
    newExecClient,
    newRollup,
    newArchive,
    ethRpcUrlError
  ]);

  return {
    reqStatus,
    setReqStatus,
    ethRpcUrlError,
    setEthRpcUrlError,
    newExecClient,
    setNewExecClient,
    newRollup,
    setNewRollup,
    newArchive,
    setNewArchive,
    currentOptimismConfig,
    setCurrentOptimismConfig,
    changes
  };
};

function getChanges({
  currentOptimismConfig,
  newExecClient,
  newRollup,
  newArchive,
  ethRpcUrlError
}: {
  currentOptimismConfig: OptimismConfigSet;
  newExecClient?: OptimismItemOk<"execution">;
  newRollup?: OptimismItemOk<"rollup">;
  newArchive?: OptimismItemOk<"archive">;
  ethRpcUrlError?: string | null;
}): {
  isAllowed: boolean;
  reason?: string;
  severity?: "warning" | "secondary" | "danger";
} {
  // Not allowed if ethRpcUrlError
  if (ethRpcUrlError)
    return {
      isAllowed: false,
      reason: "Invalid Ethereum RPC url",
      severity: "danger"
    };

  const { executionClient, rollup, archive } = currentOptimismConfig;

  // Not allowed if no changes
  if (
    executionClient?.dnpName === newExecClient?.dnpName &&
    Boolean(rollup) === Boolean(newRollup) &&
    Boolean(archive) === Boolean(newArchive)
  )
    return {
      isAllowed: false,
      reason: "No changes detected",
      severity: "secondary"
    };

  // Not allowed if changes AND (Execution Client or Rollup deselected)
  if (!newExecClient || !newRollup)
    return {
      isAllowed: false,
      reason: "Execution Client and Rollup are required",
      severity: "danger"
    };

  return { isAllowed: true };
}

function isOkSelectedInstalledAndRunning<T extends OptimismType>(
  item: OptimismItem<T>
): boolean {
  return (
    item.status === "ok" &&
    item.isSelected &&
    item.isInstalled &&
    item.isRunning
  );
}
