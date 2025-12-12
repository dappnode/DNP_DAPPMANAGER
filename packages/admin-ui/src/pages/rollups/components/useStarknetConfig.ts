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
    // New config
    const [newFullNode, setNewFullNode] = useState<StakerItemOk | null>(null);
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
        setCurrentStakerConfig(undefined);
        setChanges({ isAllowed: false });

        if (currentStakerConfigReq.data) {
            console.log("useStarknetConfig - currentStakerConfigReq.data:", currentStakerConfigReq.data);
            const { executionClients, web3Signer } = currentStakerConfigReq.data;

            const executionClient = executionClients.find((ec) => ec.status === "ok" && isOkSelectedInstalledAndRunning(ec));
            const signer = web3Signer.status === "ok" && isOkSelectedInstalledAndRunning(web3Signer);

            if (executionClient && executionClient.status === "ok") setNewFullNode(executionClient);
            if (signer && web3Signer.status === "ok") setNewSigner(web3Signer);

            setCurrentStakerConfig({
                network,
                executionDnpName: executionClient?.dnpName || null,
                consensusDnpName: null, // Starknet doesn't use consensus clients
                mevBoostDnpName: null, // Starknet doesn't use MEV Boost
                relays: [],
                web3signerDnpName: web3Signer.status === "ok" && web3Signer.isSelected ? web3Signer.dnpName : null
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
                    }
                })
            );
    }, [network, currentStakerConfig, newSigner, newFullNode]);

    return {
        reqStatus,
        setReqStatus,
        newFullNode,
        setNewFullNode,
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
    newStakerConfig
}: {
    currentStakerConfig: StakerConfigSet;
    newStakerConfig: StakerConfigSet;
}): {
    isAllowed: boolean;
    reason?: string;
    severity?: "warning" | "secondary" | "danger";
} {
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

function isOkSelectedInstalledAndRunning(item: StakerItemOk): boolean {
    return item.isSelected && item.isInstalled && item.isRunning;
}
