import { useRef, useState } from "react";
import { Network } from "@dappnode/types";
import { usePremium } from "hooks/premium/usePremium";

/**
 * Custom hook to handle the premium promotional modal in the stakers tab
 *
 * @param network - The current network
 * @param isExecutionChanged - Whether the execution client has changed
 * @param isSignerSelected - Whether the signer is selected
 * @returns An object containing the modal component props and a function to show the modal
 */
export function useStakersUpgradePremiumModal(
  network: Network,
  isExecutionChanged: boolean,
  isSignerSelected: boolean
) {
  const { isActivated: isPremium } = usePremium();
  const [showModal, setShowModal] = useState(false);
  const modalResolveRef = useRef<((value: boolean) => void) | null>(null);

  const handleBackupModalClose = (shouldContinue: boolean) => {
    setShowModal(false);
    if (modalResolveRef.current) {
      modalResolveRef.current(shouldContinue);
      modalResolveRef.current = null;
    }
  };

  /**
   * Shows the backup node modal if it meets its conditions and waits for user decision
   * @returns Promise that resolves to true if user wants to continue, false if they abort
   */
  async function showPremiumUpgradeModal(): Promise<boolean> {
    if (isExecutionChanged && isSignerSelected) {
      if (!isPremium) {
        // Only show backup modal for certain networks
        if (network === Network.Mainnet || network === Network.Gnosis || network === Network.Hoodi) {
          const shouldContinue = await new Promise<boolean>((resolve) => {
            modalResolveRef.current = resolve;
            setShowModal(true);
          });
          return shouldContinue;
        }
      }
    }

    return true;
  }

  return {
    show: showModal,
    onClose: handleBackupModalClose,
    showPremiumUpgradeModal
  };
}
