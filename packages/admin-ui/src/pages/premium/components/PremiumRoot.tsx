import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
// Components
import { title, subPaths } from "../data";
import Title from "components/Title";
import { usePremium } from "hooks/usePremium";
import "./premiumRoot.scss";
import Button from "components/Button";
import newTabProps from "utils/newTabProps";
import { stripeDashboard } from "params";
import { MdSettings } from "react-icons/md";
import { AdvancedNotifications } from "./AdvancedNotifications";
import { PremiumSupport } from "./PremiumSupport";
import { PremiumWrapper } from "./PremiumWrapper";
import { ActivatePremium } from "./ActivatePremium";

const PremiumRoot: React.FC = () => {
  const { isActivated, isInstalled, isLoading, isRunning, prefilledLicense } = usePremium();

  const routes: {
    name: string;
    subPath: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType<any>;
  }[] = [
    {
      name: "Activate",
      subPath: subPaths.activate,
      component: () => <ActivatePremium isActivated={isActivated} prefilledLicense={prefilledLicense} />
    },
    {
      name: "Advanced notifications",
      subPath: subPaths.advancedNotifications,
      component: () => <AdvancedNotifications />
    },
    {
      name: "Premium support",
      subPath: subPaths.premiumSupport,
      component: () => <PremiumSupport />
    },
    {
      name: "Beacon node backup",
      subPath: subPaths.beaconNodeBackup,
      component: () => <div>Beacon node backup</div>
    }
  ];

  return (
    <div className="premium-root">
      <div className="premium-header">
        <Title title={title} />
        <div className={`premium-status ${isActivated ? "activated" : "deactivated"}`}>
          {isActivated ? "Activated" : "Deactivated"}
        </div>
        {isActivated && (
          <Button href={stripeDashboard} {...newTabProps} variant="outline-secondary">
            <MdSettings /> <span>Subscription Settings </span>
          </Button>
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
