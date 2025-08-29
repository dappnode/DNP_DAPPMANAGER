import React, { useMemo } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
// Components
import { title, subPaths } from "../data";
import Title from "components/Title";
import { usePremium } from "hooks/usePremium";
import { AdvancedNotifications } from "./AdvancedNotifications";
import { PremiumSupport } from "./PremiumSupport";
import { PremiumWrapper } from "./PremiumWrapper";
import { ActivatePremium } from "./ActivatePremium";
import { BackupNode } from "./BackupNode";
import "./premiumRoot.scss";

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
        element: <BackupNode isActivated={isActivated} hashedLicense={hashedLicense} />
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

      <div className="horizontal-navbar">
        {routes.map((route) => (
          <button key={route.subPath} className="item-container">
            <NavLink to={route.subPath} className="item no-a-style" style={{ whiteSpace: "nowrap" }}>
              {route.name}
            </NavLink>
          </button>
        ))}
      </div>
      <div className="section-spacing">
        <PremiumWrapper
          isInstalled={isInstalled}
          isInstalling={isInstalling}
          installPremiumPkg={installPremiumPkg}
          isLoading={isLoading}
          isRunning={isRunning}
          successComponent={
            <Routes>
              {routes.map((r) => (
                <Route key={r.subPath} path={r.subPath} element={r.element} />
              ))}
            </Routes>
          }
        />
      </div>
    </div>
  );
};

export default PremiumRoot;
