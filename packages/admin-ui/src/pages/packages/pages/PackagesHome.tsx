import React from "react";
import { Routes, Route } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { title, subPaths } from "../data";
// Components
import { PackagesList } from "../components/PackagesList";
import Title from "components/Title";
// Style
import "../components/packages.scss";
import { PackageById } from "./ById";

export function PackagesHome() {
  const routes: {
    name: string;
    subPath: string;
    subLink: string;
    component: React.ComponentType<any>;
  }[] = [
    {
      name: "My packages",
      subPath: subPaths.my,
      subLink: "my",
      component: () => <PackagesList coreDnps={false} />
    },
    {
      name: "System packages",
      subPath: subPaths.system,
      subLink: "system",
      component: () => <PackagesList coreDnps={true} />
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
                <Route path=":id/*" element={<PackageById />} />
              </Routes>
            }
          />
        ))}
      </Routes>
    </>
  );
}
