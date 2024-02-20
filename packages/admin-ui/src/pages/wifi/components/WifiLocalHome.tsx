import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
// Own module
import { title, subPaths } from "../data";
// Components
import Title from "components/Title";
import WifiHome from "./wifi/WifiHome";
import { LocalProxying } from "./localProxying/LocalProxying";
// CSS
import "./wifiLocal.scss";

export const WifiLocalHome: React.FC = () => {
  const availableRoutes: {
    name: string;
    subPath: string;
    component: React.ComponentType<any>;
  }[] = [
    {
      name: "Wi-Fi",
      subPath: subPaths.wifi,
      component: WifiHome
    },
    {
      name: "Local Network",
      subPath: subPaths.local,
      component: LocalProxying
    }
  ];

  return (
    <>
      <Title title={title} />
      <div className="horizontal-navbar">
        {availableRoutes.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={route.subPath}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {route.name}
            </NavLink>
          </button>
        ))}
      </div>

      <div className="section-spacing">
        <Routes>
          {availableRoutes.map(route => (
            <Route
              key={route.subPath}
              path={route.subPath}
              element={<route.component />}
            />
          ))}
        </Routes>
      </div>
    </>
  );
};
