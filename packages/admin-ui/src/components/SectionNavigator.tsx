import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { RouteType } from "types";
import "./sectionNavigator.scss";

interface SectionNavbarProps {
  routes: RouteType[];
  hideNavbar?: boolean;
}

export const SectionNavigator: React.FC<SectionNavbarProps> = ({ routes, hideNavbar = false }) => {
  return (
    <div>
      {/* Navbar   */}
      {!hideNavbar && (
        <div className="horizontal-navbar">
          {routes
            .filter((route) => !route.hideSection)
            .map((route) => (
              <button key={route.subPath + "/*"} className="item-container">
                <NavLink to={route.subPath} className="item no-a-style" style={{ whiteSpace: "nowrap" }}>
                  {route.name}
                </NavLink>
              </button>
            ))}
        </div>
      )}

      {/* Route render   */}
      <div className="section-spacing">
        <Routes>
          {routes.map((route) => (
            <Route key={route.subPath + "/*"} path={route.subPath + "/*"} element={<route.component />} />
          ))}
        </Routes>
      </div>
    </div>
  );
};
