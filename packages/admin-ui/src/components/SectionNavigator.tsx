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
                  {route.name.toUpperCase()}
                </NavLink>
              </button>
            ))}
        </div>
      )}

      {/* Route render   */}
      <div>
        <Routes>
          {routes.map((r) => (
            <React.Fragment key={r.subPath}>
              <Route path={r.subPath} element={r.element} />
              {/* catch sub-nested child routes */}
              <Route path={`${r.subPath}/*`} element={r.element} />
            </React.Fragment>
          ))}
        </Routes>
      </div>
    </div>
  );
};
