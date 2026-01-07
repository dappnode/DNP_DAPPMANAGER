import React, { useMemo } from "react";
// Components
import { title, subPaths } from "../data";
import Title from "components/Title";
import { usePremium } from "hooks/premium/usePremium";
import { AdvancedNotifications } from "./AdvancedNotifications";
import { PremiumSupport } from "./PremiumSupport";
import { PremiumWrapper } from "./PremiumWrapper";
import { ActivatePremium } from "./ActivatePremium";
// import { BackupNode } from "./BackupNode";
import "./premiumRoot.scss";
import { SectionNavigator } from "components/SectionNavigator";
import { BackupNode } from "./backupNode/BackupNode";

const PremiumRoot: React.FC = () => {
  const premium = usePremium();

  const {
    isActivated,
    isInstalled,
    isInstalling,
    installPremiumPkg,
    isLoading,
    isRunning,
    licenseKey,
    prefilledLicenseKey,
    setLicenseKey,
    handleActivate,
    isActivationLoading,
    licenseActivationError,
    handleDectivate,
    hashedLicense,
    activateTimeout
  } = premium;

  const routes = useMemo(
    () => [
      {
        name: "Activate",
        subPath: subPaths.activate,
        element: (
          <ActivatePremium
            isActivated={isActivated}
            licenseKey={licenseKey}
            prefilledLicenseKey={prefilledLicenseKey}
            setLicenseKey={setLicenseKey}
            handleActivate={handleActivate}
            handleDectivate={handleDectivate}
            isActivationLoading={isActivationLoading}
            licenseActivationError={licenseActivationError}
            activateTimeout={activateTimeout}
          />
        )
      },
      {
        name: "Advanced notifications",
        subPath: subPaths.advancedNotifications,
        element: <AdvancedNotifications isActivated={isActivated} />
      },
      {
        name: "Premium support",
        subPath: subPaths.premiumSupport,
        element: <PremiumSupport isActivated={isActivated} />
      },
      {
        name: "Backup node for validators",
        subPath: subPaths.backupNode,
        element: <BackupNode isActivated={isActivated} hashedLicense={"05f116fdb971e44f1c59fddc8a299540"} />
      }
    ],
    [
      isActivated,
      licenseKey,
      setLicenseKey,
      handleActivate,
      handleDectivate,
      isActivationLoading,
      licenseActivationError,
      activateTimeout,
      hashedLicense
    ]
  );
  return (
    <div className="premium-root">
      <div className="premium-header">
        <Title title={title} />
        {!isActivationLoading && (
          <div className={`premium-status ${isActivated ? "activated" : "deactivated"}`}>
            {isActivated ? "Activated" : "Deactivated"}
          </div>
        )}
      </div>

      <PremiumWrapper
        isInstalled={isInstalled}
        isInstalling={isInstalling}
        installPremiumPkg={installPremiumPkg}
        isLoading={isLoading}
        isRunning={isRunning}
        successComponent={<SectionNavigator routes={routes} />}
      />
    </div>
  );
};

export default PremiumRoot;
