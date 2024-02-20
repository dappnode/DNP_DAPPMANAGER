import React from "react";
import { NavLink } from "react-router-dom";
import { sidenavItems, fundedBy } from "./navbarItems";
import logoWide from "img/dappnode-logo-wide-min.png";
import logoWideDark from "img/dappnode-logo-wide-min-dark.png";
import logomin from "img/dappnode-logo-only.png";
import { AppContext } from "../../App";
import "./sidebar.scss";

if (!Array.isArray(sidenavItems)) throw Error("sidenavItems must be an array");
if (!Array.isArray(fundedBy)) throw Error("fundedBy must be an array");

export default function SideBar({ screenWidth }: { screenWidth: number }) {
  const { theme, rollupsModuleStatus, stakersModuleStatus } = React.useContext(
    AppContext
  );

  const stakersItem = sidenavItems.find(item => item.name === "Stakers");
  if (stakersItem) {
    if (stakersModuleStatus === "enabled") stakersItem.show = true;
    else stakersItem.show = false;
  }
  const rollupsItem = sidenavItems.find(item => item.name === "Rollups");
  if (rollupsItem) {
    if (rollupsModuleStatus === "enabled") rollupsItem.show = true;
    else rollupsItem.show = false;
  }

  return (
    <div id="sidebar">
      <NavLink to={"/"}>
        <img
          className="sidebar-logo header"
          src={
            screenWidth > 640
              ? theme === "dark"
                ? logoWideDark
                : logoWide
              : logomin
          }
          alt="logo"
        />
      </NavLink>

      <div className="nav">
        {sidenavItems
          .filter(item => item.show === true)
          .map(item => (
            <NavLink className={`sidenav-item selectable`} to={item.href}>
              <item.icon />
              {screenWidth > 640 && (
                <span className="name svg-text">{item.name}</span>
              )}
            </NavLink>
          ))}
      </div>

      {/* spacer keeps the funded-by section at the bottom (if possible) */}
      <div className="spacer" />

      <div className="funded-by">
        <div
          className={
            theme === "light" ? "funded-by-text-light" : "funded-by-text-dark"
          }
        >
          SUPPORTED BY
        </div>
        <div className="funded-by-logos">
          {fundedBy.map((item, i) => (
            <a key={i} href={item.link}>
              <img
                src={item.logo}
                className={
                  theme === "light"
                    ? "img-fluid funded-by-logo-light"
                    : "img-fluid funded-by-logo-dark"
                }
                alt="logo"
                data-toggle="tooltip"
                data-placement="top"
                title={item.text}
                data-delay="300"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
