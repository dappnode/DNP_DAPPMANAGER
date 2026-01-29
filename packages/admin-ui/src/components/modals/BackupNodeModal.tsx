import React from "react";
import dappnodeServerShield from "img/dappnode_server_shield.png";
import BasePromotionModal from "./BasePromotionModal";
import { useNavigate } from "react-router-dom";
import { relativePath as premiumRelativePath } from "pages/premium/data";
import { premiumLanding } from "params";

interface UpgradeToPremiumModal {
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

export function UpgradeToPremiumModal({ show, onClose }: UpgradeToPremiumModal) {
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
