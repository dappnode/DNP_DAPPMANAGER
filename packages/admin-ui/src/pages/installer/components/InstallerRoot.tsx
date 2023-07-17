import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
// Components
import InstallDnpContainer from "./InstallDnpContainer";
import { title, subPaths } from "../data";
import Title from "components/Title";
import { InstallerDnp } from "./dappnodeDappstore/InstallerDnp";
import { InstallerPublic } from "./publicDappstore/InstallerPublic";
// Styles
import "./installer.scss";

const InstallerRoot: React.FC = () => {
  const routes: {
    name: string;
    subPath: string;
    subLink: string;
    component: React.ComponentType<any>;
  }[] = [
    {
      name: "Dnp",
      subPath: subPaths.dnp,
      subLink: "dnp",
      component: () => <InstallerDnp />
    },
    {
      name: "Public",
      subPath: subPaths.public,
      subLink: "public",
      component: () => <InstallerPublic />
    }
  ];
  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {routes.map(option => (
          <button key={option.subPath} className="item-container">
            <NavLink
              to={option.subLink}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {option.name}
            </NavLink>
          </button>
        ))}
      </div>

      <Routes>
        {routes.map(route => (
          <Route
            key={route.subPath}
            path={route.subPath}
            element={
              <Routes>
                <Route index element={<route.component />} />
                <Route path=":id/*" element={<InstallDnpContainer />} />
              </Routes>
            }
          />
        ))}
      </Routes>
    </>
  );
};

export default InstallerRoot;
