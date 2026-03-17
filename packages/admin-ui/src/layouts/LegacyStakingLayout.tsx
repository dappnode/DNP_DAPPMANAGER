import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "components/sidebar/SideBar";
import { TopBar } from "components/topbar/TopBar";
import NotificationsMain from "components/NotificationsMain";
import ErrorBoundary from "components/ErrorBoundary";
import Welcome from "components/welcome/Welcome";
import Smooth from "components/Smooth";
import { PwaPermissionsAlert, PwaPermissionsModal } from "components/PwaPermissions";
import { LocalProxyBanner } from "pages/wifi/components/localProxying/LocalProxyBanner";
import { ToastContainer } from "react-toastify";
import { AppContextIface } from "types";

/**
 * Layout wrapper for all legacy pages under /staking/*.
 * Includes the sidebar, topbar, and all legacy chrome.
 * Bootstrap + legacy SCSS remain the styling source for these pages.
 * Do not add Tailwind classes or shadcn components here.
 */
export function LegacyStakingLayout({
  screenWidth,
  username,
  appContext
}: {
  screenWidth: number;
  username: string;
  appContext: AppContextIface;
}) {
  return (
    <div className="legacy-bootstrap">
      <SideBar screenWidth={screenWidth} />
      <TopBar username={username} appContext={appContext} />
      <div id="main">
        <ErrorBoundary>
          <LocalProxyBanner />
          <NotificationsMain />
        </ErrorBoundary>
        <PwaPermissionsAlert />
        <Outlet />
      </div>

      {/* Legacy non-page components */}
      <Welcome />
      <Smooth />
      <PwaPermissionsModal />
      <ToastContainer />
    </div>
  );
}
