import React from "react";
import { NavLink } from "react-router-dom";
import { sidenavItems, fundedBy } from "./navbarItems";
import logoWide from "img/dappnode-logo-wide-min.png";
import logomin from "img/dappnode-logo-only.png";
import "./sidebar.scss";

if (!Array.isArray(sidenavItems)) throw Error("sidenavItems must be an array");
if (!Array.isArray(fundedBy)) throw Error("fundedBy must be an array");

export default function SideBar({ screenWidth }: { screenWidth: number }) {
  return (
    <div id="sidebar">
      <NavLink to={"/"}>
        <img
          className="sidebar-logo header"
          src={screenWidth > 640 ? logoWide : logomin}
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
        <div className="funded-by-text">SUPPORTED BY</div>
        <div className="funded-by-logos">
          {fundedBy.map((item, i) => (
            <a key={i} href={item.link}>
              <img
                src={item.logo}
                className="img-fluid funded-by-logo"
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
