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
  const [customMainnetRpcUrl, setCustomMainnetRpcUrl] = useState<string | null>(
    null
  );
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

      if (rollup.mainnetRpcUrl) setCustomMainnetRpcUrl(rollup.mainnetRpcUrl);

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
          ethRpcUrlError,
          customMainnetRpcUrl
        })
      );
  }, [
    currentOptimismConfig,
    newExecClient,
    newRollup,
    newArchive,
    ethRpcUrlError,
    customMainnetRpcUrl
  ]);

  useEffect(() => {
    // If the URL is null, then OP Node will use the corresponding RPC to _DAPPNODE_GLOBAL_EXECUTION_CLIENT_MAINNET
    if (customMainnetRpcUrl) {
      setEthRpcUrlError(validateUrl(customMainnetRpcUrl));
    } else {
      setEthRpcUrlError(
        "You need to set an Ethereum mainnet full node in the Stakers menu (execution + consensus clients) or set a custom RPC URL)"
      );
    }
  }, [customMainnetRpcUrl]);

  return {
    reqStatus,
    setReqStatus,
    ethRpcUrlError,
    setEthRpcUrlError,
    newExecClient,
    setNewExecClient,
    customMainnetRpcUrl,
    setCustomMainnetRpcUrl,
    newRollup,
    setNewRollup,
    newArchive,
    setNewArchive,
    currentOptimismConfig,
    changes
  };
};

function getChanges({
  currentOptimismConfig,
  newExecClient,
  newRollup,
  newArchive,
  ethRpcUrlError,
  customMainnetRpcUrl
}: {
  currentOptimismConfig: OptimismConfigSet;
  newExecClient?: OptimismItemOk<"execution">;
  newRollup?: OptimismItemOk<"rollup">;
  newArchive?: OptimismItemOk<"archive">;
  ethRpcUrlError?: string | null;
  customMainnetRpcUrl?: string | null;
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
    Boolean(archive?.isSelected) === Boolean(newArchive) &&
    rollup?.mainnetRpcUrl === customMainnetRpcUrl
  )
    return {
      isAllowed: false,
      reason: "No changes detected",
      severity: "secondary"
    };

  // Not allowed if only Rollup is selected
  if (!newExecClient && newRollup)
    return {
      isAllowed: false,
      reason: "OP Node selected without an Execution Client",
      severity: "danger"
    };

  // Not allowed if Execution Client is selected without Rollup
  if (newExecClient && !newRollup)
    return {
      isAllowed: false,
      reason: "Execution Client selected without OP Node",
      severity: "danger"
    };

  // Not allowed if Archive is selected without both Execution Client and Rollup
  if (newArchive && (!newExecClient || !newRollup))
    return {
      isAllowed: false,
      reason: "Execution Client and OP Node are required to select Archive",
      severity: "danger"
    };

  return { isAllowed: true };
}

function validateUrl(str: string): string | null {
  try {
    new URL(str);
    return null;
  } catch (_) {
    return "Invalid URL";
  }
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
