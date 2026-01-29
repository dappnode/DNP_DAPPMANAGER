import React from "react";
import dappnodeServerShield from "img/dappnode_server_shield.png";
import BasePromotionModal from "./BasePromotionModal.js";
import { useNavigate } from "react-router-dom";
import {
  relativePath as premiumRelativePath,
  basePath as premiumBasePath,
  subPaths as premiumsubPaths
} from "pages/premium/data";
import { premiumLanding } from "params";

// Export the disclaimer modal
export { StakerDisclaimerModal } from "./StakerDisclaimerModal";

interface UpgradeToPremiumModal {
  show: boolean;
  onClose: (shouldContinue: boolean) => void;
}

/**
 * UpgradeToPremiumModal component
 *
 * This modal is used to prompt users to upgrade to Premium when changing execution clients.
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
      imageAlt="Dappnode Server Shield"
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
 * PremiumUserModal component
 *
 * This modal is shown to premium users when changing execution clients.
 * It reminds the user that they have backup protection available
 */

interface NonPremiumUserModalProps {
  show: boolean;
  onClose: (shouldContinue: boolean) => void;
}

export function ActivateBackupModal({ show, onClose }: NonPremiumUserModalProps) {
  const navigate = useNavigate();

  const navigateToBackupTab = () => {
    navigate(`/${premiumBasePath}/${premiumsubPaths.backupNode}`);
    onClose(false); // Abort the flow
  };

  return (
    <BasePromotionModal
      show={show}
      onClose={() => onClose(true)} // Continue with the flow when closing
      title="Premium ensures you won't lose your rewards"
      description=" Since you are a Premium user, do not forget to activate your Backup node to avoid downtime while your execution client is syncing."
      imageSrc={dappnodeServerShield}
      imageAlt="Dappnode Server Shield"
      primaryButtonText="Activate Backup"
      primaryButtonAction={navigateToBackupTab} // Navigate to backup tab
      secondaryButton={{
        type: "action",
        text: "Skip",
        action: () => onClose(true) // Continue with the stakers flow
      }}
    />
  );
}
