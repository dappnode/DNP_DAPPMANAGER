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

export const TopBar = ({
  username,
  toggleTheme
}: {
  username: string;
  toggleTheme: () => void;
}) => (
  <div id="topbar">
    {/* Right justified items */}
    <ThemeSwitch toggleTheme={toggleTheme} />
    <DappnodeIdentity />
    <div className="topnav-icon-separator" />
    <ChainDataDropdown />
    <Notifications />
    <Profile username={username} />
  </div>
);
