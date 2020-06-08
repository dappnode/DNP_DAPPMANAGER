import React from "react";
// DropdownMenu components
import DappnodeIdentity from "./dropdownMenus/DappnodeIdentity";
import ChainDataDropdown from "./dropdownMenus/ChainDataDropdown";
import Notifications from "./dropdownMenus/Notifications";
// Components
import { toggleSideNav } from "./SideBar";
// Styles
import "./topbar.css";
import "./notifications.css";
import { MdMenu } from "react-icons/md";

const TopBar = () => (
  <div id="topbar">
    {/* Left justified items */}
    <div className="left">
      <button className="sidenav-toggler" onClick={toggleSideNav}>
        <MdMenu />
      </button>
    </div>
    {/* Right justified items */}
    <div className="right">
      <DappnodeIdentity />
      <div className="topnav-icon-separator" />
      <ChainDataDropdown />
      <Notifications />
    </div>
  </div>
);

export default TopBar;
