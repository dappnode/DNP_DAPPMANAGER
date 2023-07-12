import React from "react";
import { NavLink } from "react-router-dom";
import { advancedItems, basicItems, fundedBy } from "./navbarItems";
import logoWide from "img/dappnode-logo-wide-min.png";
import logoWideDark from "img/dappnode-logo-wide-min-dark.png";
import logomin from "img/dappnode-logo-only.png";
import { ThemeContext, UsageContext } from "../../App";
import "./sidebar.scss";

if (!Array.isArray(advancedItems))
  throw Error("advancedItems must be an array");
if (!Array.isArray(basicItems)) throw Error("basicItems must be an array");
if (!Array.isArray(fundedBy)) throw Error("fundedBy must be an array");

export default function SideBar({ screenWidth }: { screenWidth: number }) {
  const { theme } = React.useContext(ThemeContext);
  const { usage } = React.useContext(UsageContext);

  const sidenavItems =
    usage === "advanced" ? [...basicItems, ...advancedItems] : basicItems;
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
        {sidenavItems.map(item => (
          <NavLink
            key={item.name}
            className="sidenav-item selectable"
            to={item.href}
          >
            <item.icon />
            {/* 640 px = 40 rem */}
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
