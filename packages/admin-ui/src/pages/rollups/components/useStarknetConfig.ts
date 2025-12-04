import { useState, useEffect } from "react";
import { ReqStatus } from "types";
import { StakerConfigGet, StakerConfigSet, StakerItemOk, Network } from "@dappnode/types";
import { responseInterface } from "swr";

export const useStarknetConfig = <T extends Network.StarknetMainnet | Network.StarknetSepolia>(
    network: T,
    currentStakerConfigReq: responseInterface<StakerConfigGet, Error>
) => {
    // Request status
    const [reqStatus, setReqStatus] = useState<ReqStatus>({});
    // Error
    const [ethRpcUrlError, setEthRpcUrlError] = useState<string | null>(null);
    // New config
    const [newFullNode, setNewFullNode] = useState<StakerItemOk | null>(null);
    const [customL1RpcUrl, setCustomL1RpcUrl] = useState<string | null>(null);
    const [newSigner, setNewSigner] = useState<StakerItemOk | null>(null);
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
        setNewFullNode(null);
        setNewSigner(null);
        setCustomL1RpcUrl(null);
        setCurrentStakerConfig(undefined);
        setChanges({ isAllowed: false });

        if (currentStakerConfigReq.data) {
            const { executionClients, web3Signer } = currentStakerConfigReq.data;

            const executionClient = executionClients.find((ec) => ec.status === "ok" && isOkSelectedInstalledAndRunning(ec));

            if (executionClient && executionClient.status === "ok") setNewFullNode(executionClient);

            const currentWeb3signer = web3Signer.status === "ok" && isOkSelectedInstalledAndRunning(web3Signer) ? web3Signer : null;
            if (currentWeb3signer && web3Signer.status === "ok") setNewSigner(web3Signer);

            setCurrentStakerConfig({
                network,
                executionDnpName: executionClient?.dnpName || null,
                consensusDnpName: null, // Starknet doesn't use consensus clients
                mevBoostDnpName: null, // Starknet doesn't use MEV Boost
                relays: [],
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
                        executionDnpName: newFullNode?.dnpName || null,
                        consensusDnpName: null,
                        mevBoostDnpName: null,
                        relays: [],
                        web3signerDnpName: newSigner?.dnpName || null
                    },
                    ethRpcUrlError
                })
            );
    }, [network, currentStakerConfig, newSigner, newFullNode, ethRpcUrlError, customL1RpcUrl]);

    useEffect(() => {
        // If the URL is null, Starknet will use the corresponding RPC to L1 (mainnet or sepolia)
        const l1Network = network === Network.StarknetMainnet ? "Ethereum mainnet" : "Ethereum Sepolia";
        if (customL1RpcUrl) {
            setEthRpcUrlError(validateUrl(customL1RpcUrl));
        } else {
            setEthRpcUrlError(
                `You need to set an ${l1Network} full node in the Stakers menu (execution + consensus clients) or set a custom RPC URL`
            );
        }
    }, [customL1RpcUrl, network]);

    return {
        reqStatus,
        setReqStatus,
        ethRpcUrlError,
        setEthRpcUrlError,
        newFullNode,
        setNewFullNode,
        customL1RpcUrl,
        setCustomL1RpcUrl,
        newSigner,
        setNewSigner,
        changes
    };
};

// Utils

/**
 * Returns if the changes are allowed to be set:
 * - For Starknet, only execution client is required (no consensus client)
 * - Any change in:
 *   - Execution client
 *   - Signer
 */
function getChanges({
    currentStakerConfig,
    newStakerConfig,
    ethRpcUrlError
}: {
    currentStakerConfig: StakerConfigSet;
    newStakerConfig: StakerConfigSet;
    ethRpcUrlError: string | null;
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

    const { executionDnpName, web3signerDnpName } = currentStakerConfig;

    // Not allowed if no changes
    if (
        executionDnpName === newStakerConfig.executionDnpName &&
        web3signerDnpName === newStakerConfig.web3signerDnpName
    )
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

function isOkSelectedInstalledAndRunning(item: StakerItemOk): boolean {
    return item.isSelected && item.isInstalled && item.isRunning;
}
