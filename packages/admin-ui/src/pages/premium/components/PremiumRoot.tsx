import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
// Components
import { title, subPaths } from "../data";
import Title from "components/Title";
import { usePremium } from "hooks/usePremium";
import "./premiumRoot.scss";
import { AdvancedNotifications } from "./AdvancedNotifications";
import { PremiumSupport } from "./PremiumSupport";
import { PremiumWrapper } from "./PremiumWrapper";
import { ActivatePremium } from "./ActivatePremium";
import { BeaconNodeBackup } from "./BeaconNodeBackup";

const PremiumRoot: React.FC = () => {
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
    handleDectivate,
    hashedLicense
  } = usePremium();

  const routes: {
    name: string;
    subPath: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType<any>;
  }[] = [
    {
      name: "Activate",
      subPath: subPaths.activate,
      component: () => (
        <ActivatePremium
          isActivated={isActivated}
          licenseKey={licenseKey}
          setLicenseKey={setLicenseKey}
          handleActivate={handleActivate}
          handleDectivate={handleDectivate}
          isActivationLoading={isActivationLoading}
        />
      )
    },
    {
      name: "Advanced notifications",
      subPath: subPaths.advancedNotifications,
      component: () => <AdvancedNotifications isActivated={isActivated} />
    },
    {
      name: "Premium support",
      subPath: subPaths.premiumSupport,
      component: () => <PremiumSupport isActivated={isActivated} />
    },
    {
      name: "Beacon node backup",
      subPath: subPaths.beaconNodeBackup,
      component: () => <BeaconNodeBackup isActivated={isActivated} hashedLicense={hashedLicense}  />
    }
  ];

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
              {routes.map((route) => (
                <Route key={route.subPath} path={route.subPath} element={<route.component />} />
              ))}
            </Routes>
          }
        />
      </div>
    </div>
  );
};

export default PremiumRoot;
