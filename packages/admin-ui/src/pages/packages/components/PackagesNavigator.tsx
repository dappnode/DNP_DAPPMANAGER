// PackagesNavigator.tsx
import React from "react";
import { Routes, Route, NavLink, Navigate, useLocation, useMatch } from "react-router-dom";
import { useApi } from "api";
import { SectionNavigator } from "components/SectionNavigator";
import { PackagesList } from "../components/PackagesList";
import { subPaths, title } from "../data";
import { PackageById } from "../pages/ById";
import { RouteType } from "types";
import Title from "components/Title";
import "./packages.scss";

type NavRoute = {
  name: string;
  subPath: string;
  link: string;
};

const myPackagesRoute: NavRoute = { name: "My packages", subPath: subPaths.my, link: "my" };
const customPackagesRoute: NavRoute = { name: "My custom packages", subPath: subPaths.dev, link: "dev" };
const systemPackagesRoute: NavRoute = { name: "System packages", subPath: subPaths.system, link: "system" };

export const PackagesNavigator: React.FC = () => {
  const dnpsRequest = useApi.packagesGet();
  const hasCustomPackages = Boolean(dnpsRequest.data?.some((dnp) => dnp.isDev));
  const routesForNavbar = hasCustomPackages
    ? [myPackagesRoute, customPackagesRoute, systemPackagesRoute]
    : [myPackagesRoute, systemPackagesRoute];

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
    ...(hasCustomPackages
      ? [
          {
            name: "My custom packages",
            subPath: subPaths.dev,
            element: (
              <Routes>
                <Route index element={<PackagesList coreDnps={false} customDnps={true} />} />
                <Route path=":id/*" element={<PackageById />} />
              </Routes>
            )
          }
        ]
      : []),
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

  // Hide navbar when in a package detail view
  const location = useLocation();
  const scopePath: string = "/packages/:scope";
  const match = useMatch({ path: scopePath, end: true });
  const isBaseSubpath = !!match && routesForNavbar.some((r) => r.link === (match.params?.scope ?? ""));
  const isCustomPackagesPath = location.pathname === "/packages/dev" || location.pathname.startsWith("/packages/dev/");

  if (dnpsRequest.data !== undefined && !hasCustomPackages && isCustomPackagesPath) {
    return <Navigate to="/packages/my" replace />;
  }

  return (
    <>
      {isBaseSubpath && (
        <>
          <Title title={title} />

          <div className="horizontal-navbar">
            {routesForNavbar.map((r) => (
              <button key={r.subPath} className="item-container">
                <NavLink to={r.link} className="item no-a-style" style={{ whiteSpace: "nowrap" }}>
                  {r.name.toUpperCase()}
                </NavLink>
              </button>
            ))}
          </div>
        </>
      )}

      <SectionNavigator routes={sectionRoutes} hideNavbar />
    </>
  );
};
