import React from "react";
import { Network, ParsedNetworkBackupData } from "@dappnode/types";
import Loading from "components/Loading";
import { useBackupNodeActions } from "hooks/premium/useBackupNodeActions";
import { ConsensusCard, ValidatorsCard } from "./BackupInfoCards";
import { ActivateCard, CooldownCard, DeactivateCard, ErrorCard } from "./BackupActionCards";
import { ActivationHistoryCard } from "./BackupHistoryCard";

import "./networkBackup.scss";

export const NetworkBackup = ({
  network,
  networkData,
  isLoading,
  hashedLicense,
  backupStatusError,
  revalidateBackupCall
}: {
  network: Network;
  networkData: ParsedNetworkBackupData | undefined;
  isLoading: boolean;
  hashedLicense: string;
  backupStatusError: Error | undefined;
  revalidateBackupCall: () => Promise<boolean>;
}) => {
  const backupData = networkData;

  const { formatCountdown, timeLeft, timeUntilAvailable, activateBackup, deactivateBackup } = useBackupNodeActions({
    network,
    hashedLicense,
    isActive: backupData?.isActive || false,
    isActivable: backupData?.isActivable || false,
    currentConsensus: backupData?.consensusInfo?.name || undefined,
    timeLeftInitial: backupData?.timeLeft ?? 0,
    timeUntilAvailableInitial: backupData?.timeUntilAvailable ?? 0,
    revalidate: revalidateBackupCall
  });

  const valLimitExceeded = (backupData && backupData?.activeValidators > backupData?.validatorLimit) || false;
  const noConsensusSelected = (backupData && backupData.consensusInfo?.noConsensusSelected) || false;
  const consensusPrysmOrTeku = (backupData && !noConsensusSelected && backupData.consensusInfo?.isPrysmOrTeku) || false;

  return (
    <div>
      {isLoading ? (
        <Loading steps={["Loading network backup data..."]} />
      ) : backupData ? (
        <div className="network-backup-container">
          <div className="info-cards-row">
            <ConsensusCard
              network={network}
              consensusData={backupData.consensusInfo}
              noConsensusSelected={noConsensusSelected}
              consensusPrysmOrTeku={consensusPrysmOrTeku}
            />
            <ValidatorsCard
              network={network}
              activeValidators={backupData.activeValidators}
              maxValidators={backupData.validatorLimit}
              valLimitExceeded={valLimitExceeded}
              beaconApiError={backupData.beaconApiError}
            />
          </div>

          {/* Backup action cards */
          backupStatusError ? (
            <ErrorCard backupStatusError={backupStatusError} />
          ) : backupData.isActive ? (
            <DeactivateCard timeLeft={formatCountdown(timeLeft)} deactivateBackup={deactivateBackup} />
          ) : backupData.isActivable ? (
            <ActivateCard
              timeLeft={formatCountdown(backupData.timeLeft)}
              valLimitExceeded={valLimitExceeded}
              noConsensusSelected={noConsensusSelected}
              consensusPrysmOrTeku={consensusPrysmOrTeku}
              activateBackup={activateBackup}
            />
          ) : (
            <CooldownCard timeLeft={formatCountdown(timeUntilAvailable)} deactivateBackup={deactivateBackup} />
          )}
          <ActivationHistoryCard
            activationsHistory={backupData.activationHistoryParsed}
            isActive={backupData.isActive}
          />
        </div>
      ) : (
        <p>No backup data available</p>
      )}
    </div>
  );
};
