import { useRef, useState } from "react";
import { Network } from "@dappnode/types";
import { confirm } from "components/ConfirmDialog";
import { disclaimer } from "pages/stakers/data";
import { usePremium } from "hooks/premium/usePremium";

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
  const { isActivated: isPremium } = usePremium();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const modalResolveRef = useRef<((value: boolean) => void) | null>(null);

  /**
   * Handles the premium modal close action
   */
  const handlePremiumModalClose = (shouldContinue: boolean) => {
    setShowPremiumModal(false);
    if (modalResolveRef.current) {
      modalResolveRef.current(shouldContinue);
      modalResolveRef.current = null;
    }
  };

  /**
   * Shows the premium upgrade modals if conditions are met
   * @returns Promise that resolves to true if user wants to continue, false if they abort
   */
  async function displayPremiumModals(): Promise<boolean> {
    // Only check if execution changed AND signer is selected
    if (isExecutionChanged && isSignerSelected) {
      // Only for non-premium users
      if (!isPremium) {
        // Only show modal for certain networks
        if (network === Network.Mainnet || network === Network.Gnosis || network === Network.Hoodi) {
          const shouldContinue = await new Promise<boolean>((resolve) => {
            modalResolveRef.current = resolve;
            setShowPremiumModal(true);
          });
          return shouldContinue;
        }
      }
    }

    // If conditions not met, always continue
    return true;
  }

  /**
   * Shows the disclaimer confirmation dialog
   * @returns Promise that resolves when user continues
   */
  async function showDisclaimerModal(): Promise<void> {
    await new Promise((resolve: (confirmOnSetConfig: boolean) => void) => {
      confirm({
        title: `Disclaimer`,
        text: disclaimer,
        buttons: [
          {
            label: "Continue",
            variant: "dappnode",
            onClick: () => resolve(true)
          }
        ]
      });
    });
  }

  /**
   * Orchestrates all required modals for the configuration flow
   * This is the main function to call when you need user approval for config changes
   *
   * @param isLaunchpad - Whether this is being called from the launchpad flow
   * @returns true if user approved all steps, false if they aborted
   */
  async function modalsFlowStart(isLaunchpad: boolean): Promise<boolean> {
    // Step 1: Check if user needs to upgrade to premium
    const userApprovedPremium = await displayPremiumModals();
    if (!userApprovedPremium) {
      return false;
    }

    // Step 2: Show disclaimer (unless coming from launchpad)
    if (!isLaunchpad) {
      await showDisclaimerModal();
    }

    return true;
  }

  return {
    // Premium modal UI state
    premiumModalShow: showPremiumModal,
    premiumModalOnClose: handlePremiumModalClose,
    // Main flow function
    modalsFlowStart
  };
}
