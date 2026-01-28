import React from "react";
import dappnodeServerShield from "img/dappnode_server_shield.png";
import BasePromotionModal from "./BasePromotionModal";
import { useNavigate } from "react-router-dom";
import { relativePath as premiumRelativePath } from "pages/premium/data";
import { premiumLanding } from "params";
import { Network } from "@dappnode/types";
import { usePremium } from "hooks/premium/usePremium";

interface BackupNodeModalProps {
  show: boolean;
  onClose: (shouldContinue: boolean) => void;
}

/**
 * BackupNodeModal component
 *
 * This modal is used to prompt users to upgrade to Premium when changing execution clients.
 *
 *  Primary Button ("Upgrade to Premium")
 *   - Navigates to the premium tab
 *   - Calls onClose(false) to abort the flow
 *
 *  Secondary Button ("Learn More")
 *   - Opens the external documentation link in a new tab
 *   - Does NOT close the modal
 *   - User can read the landing page and come back to the modal
 *
 *  Close Button (X) or Backdrop Click
 *   - Calls onClose(true) to continue with the flow
 *
 */

export default function BackupNodeModal({ show, onClose }: BackupNodeModalProps) {
  const navigate = useNavigate();

  const navigateToPremiumTab = () => {
    navigate(`/${premiumRelativePath}`);
    onClose(false); // Abort the flow
  };

  return (
    <BasePromotionModal
      show={show}
      onClose={() => onClose(true)} // Continue with the flow when closing via X or backdrop
      title="Node runner, you are about to lose rewards!"
      description="The Backup node keeps your validators attesting and proposing blocks when your local clients are syncing or not available. No more downtime."
      imageSrc={dappnodeServerShield}
      imageAlt="DAppNode Server Shield"
      primaryButtonText="Upgrade to Premium"
      primaryButtonAction={navigateToPremiumTab}
      secondaryButton={{
        type: "external-link",
        text: "Learn More",
        href: premiumLanding
      }}
    />
  );
}

/**
 * Custom hook to handle the backup node modal in the stakers tab
 *
 * @param network - The current network
 * @param isExecutionChanged - Whether the execution client has changed
 * @param isSignerSelected - Whether the signer is selected
 * @returns An object containing the modal component props and a function to show the modal
 */
export function useBackupNodeModal(network: Network, isExecutionChanged: boolean, isSignerSelected: boolean) {
  const { isActivated: isPremium } = usePremium();
  const [showBackupModal, setShowBackupModal] = React.useState(false);
  const modalResolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const handleBackupModalClose = (shouldContinue: boolean) => {
    setShowBackupModal(false);
    if (modalResolveRef.current) {
      modalResolveRef.current(shouldContinue);
      modalResolveRef.current = null;
    }
  };

  /**
   * Shows the backup node modal if it meets its conditions and waits for user decision
   * @returns Promise that resolves to true if user wants to continue, false if they abort
   */
  async function showBackupNodeModal(): Promise<boolean> {
    if (isExecutionChanged && isSignerSelected) {
      if (!isPremium) {
        // Only show backup modal for certain networks
        if (network === Network.Mainnet || network === Network.Gnosis || network === Network.Hoodi) {
          const shouldContinue = await new Promise<boolean>((resolve) => {
            modalResolveRef.current = resolve;
            setShowBackupModal(true);
          });
          return shouldContinue;
        }
      }
    }

    return true;
  }

  return {
    show: showBackupModal,
    onClose: handleBackupModalClose,
    showBackupNodeModal
  };
}
