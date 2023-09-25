import React from "react";
// DropdownMenu components
import DappnodeIdentity from "./dropdownMenus/DappnodeIdentity";
import ChainDataDropdown from "./dropdownMenus/ChainDataDropdown";
import Notifications from "./dropdownMenus/Notifications";
import Profile from "./dropdownMenus/Profile";
import ThemeSwitch from "./dropdownMenus/ThemeSwitch";
// Styles
import "./topbar.scss";
import "./notifications.scss";
// import UsageSwitch from "./dropdownMenus/UsageSwitch";
// Types
import { AppContextIface } from "types";
import Modules from "./dropdownMenus/Modules";

export const TopBar = ({
  username,
  appContext
}: {
  username: string;
  appContext: AppContextIface;
}) => (
  <div id="topbar">
    {/* Right justified items */}

    {appContext.theme === "light" ? (
      <div className="beta">
        <span>BETA</span>
        {/* Theme usage requires more feedback */}
        {/*<UsageSwitch toggleUsage={toggleUsage} /> */}
        <ThemeSwitch toggleTheme={appContext.toggleTheme} />
      </div>
    ) : (
      <ThemeSwitch toggleTheme={appContext.toggleTheme} />
    )}

    <DappnodeIdentity />
    <div className="topnav-icon-separator" />
    <Modules modulesContext={appContext} />
    <ChainDataDropdown />
    <Notifications />
    <Profile username={username} />
  </div>
);
