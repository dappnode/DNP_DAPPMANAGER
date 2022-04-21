import React from "react";
// DropdownMenu components
import DappnodeIdentity from "./dropdownMenus/DappnodeIdentity";
import ChainDataDropdown from "./dropdownMenus/ChainDataDropdown";
import Notifications from "./dropdownMenus/Notifications";
import Profile from "./dropdownMenus/Profile";
// Styles
import "./topbar.scss";
import "./notifications.scss";
import { MdMenu } from "react-icons/md";
import ThemeSwitch from "./dropdownMenus/ThemeSwitch";
import logo from "img/dappnode-logo-wide-min.png";
import { NavLink } from "react-router-dom";

export const TopBar = ({
  username,
  screenWidth,
  toggleTheme,
  toggleSideBar
}: {
  username: string;
  screenWidth: number;
  toggleTheme: () => void;
  toggleSideBar: () => void;
}) => (
  <div id="topbar">
    {/* Left justified items */}
    <div className="left">
      {screenWidth > 640 ? (
        <NavLink to={"/"}>
          <img className="sidebar-logo header" src={logo} alt="logo" />
        </NavLink>
      ) : (
        <button className="sidenav-toggler" onClick={() => toggleSideBar()}>
          <MdMenu />
        </button>
      )}
    </div>
    {/* Right justified items */}
    <div className="right">
      <ThemeSwitch toggleTheme={toggleTheme} />
      <DappnodeIdentity />
      <div className="topnav-icon-separator" />
      <ChainDataDropdown />
      <Notifications />
      <Profile username={username} />
    </div>
  </div>
);
