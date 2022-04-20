import React from "react";
// DropdownMenu components
import DappnodeIdentity from "./dropdownMenus/DappnodeIdentity";
import ChainDataDropdown from "./dropdownMenus/ChainDataDropdown";
import Notifications from "./dropdownMenus/Notifications";
import Profile from "./dropdownMenus/Profile";
// Components
import { toggleSideNav } from "./SideBar";
// Styles
import "./topbar.scss";
import "./notifications.scss";
import { MdMenu } from "react-icons/md";
import ThemeSwitch from "./dropdownMenus/ThemeSwitch";

export const TopBar = ({
  username,
  theme,
  setTheme
}: {
  username: string;
  theme: "light" | "dark";
  setTheme: React.Dispatch<React.SetStateAction<"light" | "dark">>;
}) => (
  <div id="topbar" className={`topbar-${theme}`}>
    {/* Left justified items */}
    <div className="left">
      <button className="sidenav-toggler" onClick={toggleSideNav}>
        <MdMenu />
      </button>
    </div>
    {/* Right justified items */}
    <div className="right">
      <ThemeSwitch theme={theme} setTheme={setTheme} />
      <DappnodeIdentity />
      <div className="topnav-icon-separator" />
      <ChainDataDropdown />
      <Notifications />
      <Profile username={username} />
    </div>
  </div>
);
