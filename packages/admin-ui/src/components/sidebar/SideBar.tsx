import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { sidenavItems, fundedBy } from "./navbarItems";
import logoWide from "img/dappnode-logo-wide-min.png";
import logoWideDark from "img/dappnode-logo-wide-min-dark.png";
import logomin from "img/dappnode-logo-only.png";
import { AppContext } from "../../App";
import "./sidebar.scss";
import { api } from "api";

if (!Array.isArray(sidenavItems)) throw Error("sidenavItems must be an array");
if (!Array.isArray(fundedBy)) throw Error("fundedBy must be an array");

export default function SideBar({ screenWidth }: { screenWidth: number }) {
  const { theme } = React.useContext(AppContext);

  const [coreVersion, setCoreVersion] = useState("");
  useEffect(() => {
    async function getCoreVersion(): Promise<void> {
      setCoreVersion(await api.getCoreVersion());
    }
    getCoreVersion();
  }, []);

  return (
    <div id="sidebar">
      <NavLink to={"/"}>
        <img
          className="sidebar-logo header"
          src={screenWidth > 640 ? (theme === "dark" ? logoWideDark : logoWide) : logomin}
          alt="logo"
        />
      </NavLink>

      <div className="nav">
        {sidenavItems
          .filter((item) => item.show === true)
          .map((item) => {
            const basePath = item.href.split("/")[0];
            const baseLocationPath = location.pathname.substring(1).split("/")[0];
            const isActive = baseLocationPath === basePath;
            return (
              <NavLink
                className={`sidenav-item selectable ${isActive && "active"} ${item.name === "Premium" &&
                  "premium-item"}`}
                to={item.href}
              >
                <item.icon />
                {screenWidth > 640 && <span className="name svg-text">{item.name}</span>}
              </NavLink>
            );
          })}
      </div>

      {/* spacer keeps the funded-by section at the bottom (if possible) */}
      <div className="spacer" />

      {coreVersion && (
        <div id="core-version" className={`${theme === "dark" && "dark"}`}>
          {screenWidth > 640 && <>core </>}
          <span>v.{coreVersion}</span>
        </div>
      )}

      <div className="funded-by">
        <div className={theme === "light" ? "funded-by-text-light" : "funded-by-text-dark"}>SUPPORTED BY</div>
        <div className="funded-by-logos">
          {fundedBy.map((item, i) => (
            <a key={i} href={item.link}>
              <img
                src={item.logo}
                className={theme === "light" ? "img-fluid funded-by-logo-light" : "img-fluid funded-by-logo-dark"}
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
