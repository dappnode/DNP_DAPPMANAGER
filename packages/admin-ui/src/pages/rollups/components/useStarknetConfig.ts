import { useState, useEffect } from "react";
import { ReqStatus } from "types";
import { StakerConfigGet, StakerConfigSet, StakerItemOk, Network } from "@dappnode/types";
import { responseInterface } from "swr";

export interface StarknetEnvs {
  signerOperationalAddress: string;
  signerPrivateKey: string;
}

export const useStarknetConfig = <T extends Network.StarknetMainnet | Network.StarknetSepolia>(
  network: T,
  currentStakerConfigReq: responseInterface<StakerConfigGet, Error>
) => {
  // Request status
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  // New config
  const [newFullNode, setNewFullNode] = useState<StakerItemOk | null>(null);
  const [newStakingApp, setNewStakingApp] = useState<StakerItemOk | null>(null);
  const [currentStakerConfig, setCurrentStakerConfig] = useState<StakerConfigSet>();
  // Starknet staking environment variables
  const [starknetEnvs, setStarknetEnvs] = useState<StarknetEnvs>({
    signerOperationalAddress: "",
    signerPrivateKey: ""
  });
  // Changes
  const [changes, setChanges] = useState<{
    isAllowed: boolean;
    reason?: string;
    severity?: "warning" | "secondary" | "danger";
  }>({ isAllowed: false });

  useEffect(() => {
    // reset new states when network changes
    setReqStatus({});
    setNewFullNode(null);
    setNewStakingApp(null);
    setCurrentStakerConfig(undefined);
    setStarknetEnvs({ signerOperationalAddress: "", signerPrivateKey: "" });
    setChanges({ isAllowed: false });

    if (currentStakerConfigReq.data) {
      console.log("useStarknetConfig - currentStakerConfigReq.data:", currentStakerConfigReq.data);
      const { executionClients, consensusClients } = currentStakerConfigReq.data;

      const executionClient = executionClients.find((ec) => ec.status === "ok" && isOkSelectedInstalledAndRunning(ec));
      const stakingApp =
        consensusClients && Array.isArray(consensusClients)
          ? consensusClients.find((cc) => cc.status === "ok" && isOkSelectedInstalledAndRunning(cc))
          : null;

      if (executionClient && executionClient.status === "ok") setNewFullNode(executionClient);
      if (stakingApp && stakingApp.status === "ok") setNewStakingApp(stakingApp);

      setCurrentStakerConfig({
        network,
        executionDnpName: executionClient?.dnpName || null,
        consensusDnpName: stakingApp?.dnpName || null,
        mevBoostDnpName: null, // Starknet doesn't use MEV Boost
        relays: [],
        web3signerDnpName: null // Starknet doesn't use Web3Signer
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
            executionDnpName: newFullNode?.dnpName || null,
            consensusDnpName: newStakingApp?.dnpName || null,
            mevBoostDnpName: null,
            relays: [],
            web3signerDnpName: null
          },
          starknetEnvs,
          hasStakingApp: !!newStakingApp
        })
      );
  }, [network, currentStakerConfig, newStakingApp, newFullNode, starknetEnvs]);

  return {
    reqStatus,
    setReqStatus,
    newFullNode,
    setNewFullNode,
    newStakingApp,
    setNewStakingApp,
    starknetEnvs,
    setStarknetEnvs,
    changes
  };
};

// Utils

// Pattern for validating Starknet address
const addressPattern = /^0x[0-9a-fA-F]{1,64}$/;

/**
 * Returns if the changes are allowed to be set:
 * - For Starknet, only execution client is required (no consensus client)
 * - If staking app is selected, SIGNER_OPERATIONAL_ADDRESS and SIGNER_PRIVATE_KEY are mandatory
 * - Any change in:
 *   - Execution client
 *   - Signer
 */
function getChanges({
  currentStakerConfig,
  newStakerConfig,
  starknetEnvs,
  hasStakingApp
}: {
  currentStakerConfig: StakerConfigSet;
  newStakerConfig: StakerConfigSet;
  starknetEnvs: StarknetEnvs;
  hasStakingApp: boolean;
}): {
  isAllowed: boolean;
  reason?: string;
  severity?: "warning" | "secondary" | "danger";
} {
  const { executionDnpName, web3signerDnpName, consensusDnpName } = currentStakerConfig;

  // Not allowed if no changes and no staking app being newly configured
  const hasClientChanges =
    executionDnpName !== newStakerConfig.executionDnpName ||
    web3signerDnpName !== newStakerConfig.web3signerDnpName ||
    consensusDnpName !== newStakerConfig.consensusDnpName;

  // Check if staking app envs are provided when staking app is selected
  const hasStakingEnvs = starknetEnvs.signerOperationalAddress && starknetEnvs.signerPrivateKey;

  if (!hasClientChanges && !hasStakingEnvs)
    return {
      isAllowed: false,
      reason: "No changes detected",
      severity: "secondary"
    };

  // Not allowed if execution client is not selected
  if (!newStakerConfig.executionDnpName)
    return {
      isAllowed: false,
      reason: "Execution client must be selected",
      severity: "warning"
    };

  // Not allowed if web3signer is selected but no execution client
  if (!newStakerConfig.executionDnpName && newStakerConfig.web3signerDnpName)
    return {
      isAllowed: false,
      reason: "To enable staking, execution client must be selected",
      severity: "warning"
    };

  // If staking app is selected, validate the required environment variables
  if (hasStakingApp) {
    if (!starknetEnvs.signerOperationalAddress || !starknetEnvs.signerPrivateKey) {
      return {
        isAllowed: false,
        reason: "Operational Address and Private Key are required when Staking Application is selected",
        severity: "warning"
      };
    }

    // Validate address pattern
    if (!addressPattern.test(starknetEnvs.signerOperationalAddress)) {
      return {
        isAllowed: false,
        reason: "Invalid Operational Address format. Must be a valid hex address (0x...)",
        severity: "danger"
      };
    }
  }

  return { isAllowed: true };
}

function isOkSelectedInstalledAndRunning(item: StakerItemOk): boolean {
  return item.isSelected && item.isInstalled && item.isRunning;
}
