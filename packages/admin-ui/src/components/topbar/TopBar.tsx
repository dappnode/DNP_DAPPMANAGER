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
import { PaletteMode } from "@mui/material";

export const TopBar = ({
  username,
  theme,
  toggleColorMode,
  toggleUsage
}: {
  username: string;
  theme: PaletteMode;
  toggleColorMode: () => void;
  toggleUsage: () => void;
}) => (
  <div id="topbar">
    {/* Right justified items */}

    {theme === "light" ? (
      <div className="beta">
        <span>BETA</span>
        {/* Theme usage requires more feedback */}
        {/*<UsageSwitch toggleUsage={toggleUsage} /> */}
        <ThemeSwitch toggleColorMode={toggleColorMode} theme={theme} />
      </div>
    ) : (
      <ThemeSwitch toggleColorMode={toggleColorMode} theme={theme} />
    )}

    <DappnodeIdentity />
    <div className="topnav-icon-separator" />
    <ChainDataDropdown />
    <Notifications />
    <Profile username={username} />
  </div>
);
