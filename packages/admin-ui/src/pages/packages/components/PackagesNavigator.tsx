// PackagesNavigator.tsx
import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { SectionNavigator } from "components/SectionNavigator";
import { PackagesList } from "../components/PackagesList";
import { subPaths } from "../data";
import { PackageById } from "../pages/ById";
import { RouteType } from "types";
import "./packages.scss";

type NavRoute = {
  name: string;
  subPath: string;
  link: string;
};

const routesForNavbar: NavRoute[] = [
  { name: "My packages", subPath: subPaths.my, link: "my" },
  { name: "System packages", subPath: subPaths.system, link: "system" }
];

export const PackagesNavigator: React.FC = () => {
  const sectionRoutes: RouteType[] = [
    {
      name: "My packages",
      subPath: subPaths.my,
      element: (
        <Routes>
          <Route index element={<PackagesList coreDnps={false} />} />
          <Route path=":id/*" element={<PackageById />} />
        </Routes>
      )
    },
    {
      name: "System packages",
      subPath: subPaths.system,
      element: (
        <Routes>
          <Route index element={<PackagesList coreDnps={true} />} />
          <Route path=":id/*" element={<PackageById />} />
        </Routes>
      )
    }
  ];

  return (
    <>
      <div className="horizontal-navbar">
        {routesForNavbar.map((r) => (
          <button key={r.subPath} className="item-container">
            <NavLink to={r.link} className="item no-a-style" style={{ whiteSpace: "nowrap" }}>
              {r.name}
            </NavLink>
          </button>
        ))}
      </div>

      <SectionNavigator routes={sectionRoutes} hideNavbar />
    </>
  );
};
