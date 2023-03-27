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
import UsageSwitch from "./dropdownMenus/UsageSwitch";

export const TopBar = ({
  username,
  toggleTheme,
  toggleUsage
}: {
  username: string;
  toggleTheme: () => void;
  toggleUsage: () => void;
}) => (
  <div id="topbar">
    {/* Right justified items */}

    <div className="beta">
      <span>BETA</span>
      <UsageSwitch toggleUsage={toggleUsage} />
      <ThemeSwitch toggleTheme={toggleTheme} />
    </div>

    <DappnodeIdentity />
    <div className="topnav-icon-separator" />
    <ChainDataDropdown />
    <Notifications />
    <Profile username={username} />
  </div>
);
