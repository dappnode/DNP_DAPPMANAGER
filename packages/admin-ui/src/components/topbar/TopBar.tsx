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
import { Theme } from "types";

export const TopBar = ({
  username,
  theme,
  toggleTheme,
  toggleUsage
}: {
  username: string;
  theme: Theme;
  toggleTheme: () => void;
  toggleUsage: () => void;
}) => (
  <div id="topbar">
    {/* Right justified items */}

    {theme === "light" ? (
      <div className="beta">
        <span>BETA</span>
        {/* Theme usage requires more feedback */}
        {/*<UsageSwitch toggleUsage={toggleUsage} /> */}
        <ThemeSwitch toggleTheme={toggleTheme} />
      </div>
    ) : (
      <ThemeSwitch toggleTheme={toggleTheme} />
    )}

    <DappnodeIdentity />
    <div className="topnav-icon-separator" />
    <ChainDataDropdown />
    <Notifications />
    <Profile username={username} />
  </div>
);
