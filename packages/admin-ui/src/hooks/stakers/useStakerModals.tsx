import { useRef, useState } from "react";
import { Network } from "@dappnode/types";
import { usePremium } from "hooks/premium/usePremium";
import { useBackupNodeData } from "hooks/premium/useBackupNodeData";

interface UseStakerConfigFlowParams {
  network: Network;
  isExecutionChanged: boolean;
  isSignerSelected: boolean;
}

/**
 * Custom hook to handle the complete staker configuration flow including all modals
 * This is the single source of truth for all modal logic in the staker configuration
 */
export function useStakerModals({ network, isExecutionChanged, isSignerSelected }: UseStakerConfigFlowParams) {
  const { isActivated: isPremium, hashedLicense } = usePremium();
  const { backupData } = useBackupNodeData({ hashedLicense, isPremiumActivated: isPremium });
  const [showNonPremiumModal, setShowNonPremiumModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const modalResolveRef = useRef<((value: boolean) => void) | null>(null);
  const nonPremiumModalResolveRef = useRef<((value: boolean) => void) | null>(null);
  const disclaimerModalResolveRef = useRef<((value: boolean) => void) | null>(null);

  /**
   * Handles the non-premium modal close action
   */
  const handleNonPremiumModalClose = (shouldContinue: boolean) => {
    setShowNonPremiumModal(false);
    if (modalResolveRef.current) {
      modalResolveRef.current(shouldContinue);
      modalResolveRef.current = null;
    }
  };

  /**
   * Handles the premium modal close action
   */
  const handlePremiumModalClose = (shouldContinue: boolean) => {
    setShowPremiumModal(false);
    if (nonPremiumModalResolveRef.current) {
      nonPremiumModalResolveRef.current(shouldContinue);
      nonPremiumModalResolveRef.current = null;
    }
  };

  /**
   * Handles the disclaimer modal close action
   */
  const handleDisclaimerModalClose = (accepted: boolean) => {
    setShowDisclaimerModal(false);
    if (disclaimerModalResolveRef.current) {
      disclaimerModalResolveRef.current(accepted);
      disclaimerModalResolveRef.current = null;
    }
  };

  /**
   * Shows the premium upgrade modals if conditions are met
   * @returns Promise that resolves to true if user wants to continue, false if they abort
   */
  async function displayPremiumModals(): Promise<boolean> {
    // Only check if execution changed AND signer is selected
    if (isExecutionChanged && isSignerSelected) {
      // Only show modal for networks with Backup Node support
      if (network === Network.Mainnet || network === Network.Gnosis || network === Network.Hoodi) {
        const shouldContinue = await new Promise<boolean>((resolve) => {
          if (isPremium) {
            // Check if Backup Node isn't already active and is activable for this network
            const networkBackupData = backupData[network];
            if (!networkBackupData?.isActive && networkBackupData?.isActivable) {
              nonPremiumModalResolveRef.current = resolve;
              setShowPremiumModal(true);
            } else {
              // Continue without showing modal
              resolve(true);
            }
          } else {
            modalResolveRef.current = resolve;
            setShowNonPremiumModal(true);
          }
        });
        return shouldContinue;
      }
    }

    // If conditions not met, always continue
    return true;
  }

  /**
   * Shows the disclaimer modal
   * @returns Promise that resolves to true if user accepts, false if they decline
   */
  async function displayDisclaimerModal(): Promise<boolean> {
    const accepted = await new Promise<boolean>((resolve) => {
      disclaimerModalResolveRef.current = resolve;
      setShowDisclaimerModal(true);
    });
    return accepted;
  }

  return {
    // Non-premium modal UI state
    nonPremiumModalShow: showNonPremiumModal,
    nonPremiumModalOnClose: handleNonPremiumModalClose,
    // Premium modal UI state
    premiumModalShow: showPremiumModal,
    premiumModalOnClose: handlePremiumModalClose,
    // Disclaimer modal UI state
    disclaimerModalShow: showDisclaimerModal,
    disclaimerModalOnClose: handleDisclaimerModalClose,
    displayPremiumModals,
    displayDisclaimerModal
  };
}
