import { useState, useEffect } from 'react';
import { ReqStatus } from "types";
import { Network } from '@dappnode/types';
import { StakerConfigGet, StakerConfigSet, StakerItemOk, StakerType, StakerItem, } from '@dappnode/common';
import { responseInterface } from 'swr';

export const useStakerConfig = <T extends Network>(network: T, currentStakerConfigReq: responseInterface<StakerConfigGet<T>, Error>) => {
    // Request status
    const [reqStatus, setReqStatus] = useState<ReqStatus>({});
    // Launchpad
    const [showLaunchpadValidators, setShowLaunchpadValidators] = useState(false);
    const [allStakerItemsOk, setAllStakerItemsOk] = useState<boolean>(false);
    // Error
    const [feeRecipientError, setFeeRecipientError] = useState<string | null>(null);
    // New config
    const [newFeeRecipient, setNewFeeRecipient] = useState<string>("");
    const [newExecClient, setNewExecClient] = useState<StakerItemOk<T, "execution">>();
    const [newConsClient, setNewConsClient] = useState<StakerItemOk<T, "consensus">>();
    const [newMevBoost, setNewMevBoost] = useState<StakerItemOk<T, "mev-boost">>();
    const [newEnableWeb3signer, setNewEnableWeb3signer] = useState<boolean>(false);
    const [currentStakerConfig, setCurrentStakerConfig] = useState<StakerConfigSet<T>>();
    // Changes 
    const [changes, setChanges] = useState<{ isAllowed: boolean; reason?: string; severity?: "warning" | "secondary" | "danger"; }>({ isAllowed: false });
    // execution client cards
    const [executionClientsCards, setExecutionClientsCards] = useState<StakerItem<T, "execution">[]>([]);
    // consensus clients cards
    const [consensusClientsCards, setConsensusClientsCards] = useState<StakerItem<T, "consensus">[]>([]);

    // Use effect to set the execution and consensus clients cards
    // it will order them so that the selected one is first
    useEffect(() => {
        if (currentStakerConfigReq.data) {
            const { executionClients, consensusClients } = currentStakerConfigReq.data;
            setExecutionClientsCards(executionClients.sort((a, b) => {
                if (a.status === "ok" && b.status === "ok") {
                    if (a.isSelected && b.isSelected) return 0;
                    if (a.isSelected) return -1;
                    if (b.isSelected) return 1;
                    return 0;
                }
                if (a.status === "ok") return -1;
                if (b.status === "ok") return 1;
                return 0;
            }))
            setConsensusClientsCards(consensusClients.sort((a, b) => {
                if (a.status === "ok" && b.status === "ok") {
                    if (a.isSelected && b.isSelected) return 0;
                    if (a.isSelected) return -1;
                    if (b.isSelected) return 1;
                    return 0;
                }
                if (a.status === "ok") return -1;
                if (b.status === "ok") return 1;
                return 0;
            }))
        }

    }, [currentStakerConfigReq.data, network])

    useEffect(() => {
        if (currentStakerConfigReq.data) {
            const {
                executionClients,
                consensusClients,
                mevBoost,
                web3Signer,
                feeRecipient
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
            if (feeRecipient) setNewFeeRecipient(feeRecipient);

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
                enableWeb3signer,
                feeRecipient: feeRecipient || ""
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
        if (newFeeRecipient)
            setFeeRecipientError(validateEthereumAddress(newFeeRecipient));
    }, [newFeeRecipient]);

    useEffect(() => {
        if (currentStakerConfig)
            setChanges(
                getChanges({
                    currentStakerConfig,
                    feeRecipientError,
                    newConsClient,
                    newMevBoost,
                    newEnableWeb3signer,
                    newExecClient,
                    newFeeRecipient
                })
            );
    }, [
        currentStakerConfig,
        feeRecipientError,
        newConsClient,
        newMevBoost,
        newEnableWeb3signer,
        newExecClient,
        newFeeRecipient
    ]);

    return {
        showLaunchpadValidators,
        setShowLaunchpadValidators,
        allStakerItemsOk,
        feeRecipientError,
        reqStatus,
        setReqStatus,
        newFeeRecipient,
        setNewFeeRecipient,
        newExecClient,
        setNewExecClient,
        newConsClient,
        setNewConsClient,
        newMevBoost,
        setNewMevBoost,
        newEnableWeb3signer,
        setNewEnableWeb3signer,
        changes,
        executionClientsCards,
        setExecutionClientsCards,
        consensusClientsCards,
        setConsensusClientsCards,
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
    feeRecipientError,
    newConsClient,
    newMevBoost,
    newEnableWeb3signer,
    newExecClient,
    newFeeRecipient
}: {
    currentStakerConfig: StakerConfigSet<T>;
    feeRecipientError: string | null;
    newExecClient: StakerItemOk<T, "execution"> | undefined;
    newConsClient?: StakerItemOk<T, "consensus">;
    newMevBoost?: StakerItemOk<T, "mev-boost">;
    newEnableWeb3signer: boolean;
    newFeeRecipient?: string;
}): {
    isAllowed: boolean;
    reason?: string;
    severity?: "warning" | "secondary" | "danger";
} {
    // Not allowed if feerecipient is invalid
    if (feeRecipientError)
        return {
            isAllowed: false,
            reason: "Invalid fee recipient",
            severity: "danger"
        };

    const {
        executionClient,
        consensusClient,
        mevBoost,
        enableWeb3signer,
        feeRecipient
    } = currentStakerConfig;
    const isExecAndConsSelected = Boolean(newExecClient && newConsClient);
    const isExecAndConsDeSelected = Boolean(!newExecClient && !newConsClient);

    // Not allowed if no changes
    if (
        executionClient?.dnpName === newExecClient?.dnpName &&
        consensusClient?.dnpName === newConsClient?.dnpName &&
        mevBoost?.dnpName === newMevBoost?.dnpName &&
        newMevBoost?.relays?.length === mevBoost?.relays?.length &&
        currentStakerConfig.consensusClient?.useCheckpointSync ===
        newConsClient?.useCheckpointSync &&
        enableWeb3signer === newEnableWeb3signer &&
        feeRecipient === newFeeRecipient
    )
        return {
            isAllowed: false,
            reason: "No changes detected",
            severity: "secondary"
        };

    // Not allowed if no fee recipient
    if (!newFeeRecipient)
        return {
            isAllowed: false,
            reason: "A fee recipient must be set",
            severity: "warning"
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

function validateEthereumAddress(value?: string): string | null {
    if (value && !/^0x[0-9a-fA-F]{40}$/.test(value)) return "Invalid address";
    return null;
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