import React from "react";
// DropdownMenu components
import DappnodeIdentity from "./dropdownMenus/DappnodeIdentity";
import ChainDataDropdown from "./dropdownMenus/ChainDataDropdown";
import InstallerDropdown from "./dropdownMenus/InstallerDropdown";
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

// Pkgs Installing data
import { useSelector } from "react-redux";
import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";

export const TopBar = ({ username, appContext }: { username: string; appContext: AppContextIface }) => {
  const progressLogsByDnp = useSelector(getProgressLogsByDnp);
  const isPkgInstalling = Object.keys(progressLogsByDnp).length !== 0;

  return (
    <div id="topbar">
      {/* Right justified items */}

      {appContext.theme === "light" ? (
        <ThemeSwitch toggleTheme={appContext.toggleTheme} />
      ) : (
        <ThemeSwitch toggleTheme={appContext.toggleTheme} />
      )}

      <DappnodeIdentity />
      <div className="topnav-icon-separator" />
      {isPkgInstalling && <InstallerDropdown installLogs={progressLogsByDnp} />}
      <Modules modulesContext={appContext} />
      <ChainDataDropdown />
      <Notifications />
      <Profile username={username} />
    </div>
  );
};
