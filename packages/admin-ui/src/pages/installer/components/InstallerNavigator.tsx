// InstallerNavigator.tsx
import React from "react";
import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import { SectionNavigator } from "components/SectionNavigator";
import InstallDnpContainer from "./InstallDnpContainer";
import { InstallerDnp } from "./dappnodeDappstore/InstallerDnp";
import { InstallerPublic } from "./publicDappstore/InstallerPublic";
import { confirm } from "components/ConfirmDialog";
import { subPaths } from "../data";
import "./installer.scss";
import { RouteType } from "types";

type NavRoute = {
  name: string;
  subPath: string;
  link: string;
};

const routesForNavbar: NavRoute[] = [
  { name: "Dnp", subPath: subPaths.dnp, link: "dnp" },
  { name: "Public", subPath: subPaths.public, link: "public" }
];

export const InstallerNavigator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Do not show the horizontal navbar in the following paths: /installer/dnp/:id/* and /installer/public/:id/*
  // it looks weird and it is not needed
  const hideNavbarPattern = /\/installer\/(dnp|public)\/.+/;
  const hideNavbar = hideNavbarPattern.test(location.pathname);

  async function confirmPublicDappstore(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await new Promise<void>((resolve, reject) =>
        confirm({
          title: `Are you sure you want to see the public repository?`,
          text: `The public repository is open and permissionless and can contain malicious packages that can compromise the security of your DAppNode. ONLY use the public repo if you know what you are doing and ONLY install packages whose developer you trust.

Nobody, DAppNode Association, DAppNodeDAO or anyone, will be held responsible for loss of funds, the compromising of the hardware or any other non intended consequences of installing a non-curated package.`,
          label: "Public DAppStore",
          buttons: [
            { variant: "dappnode", label: "Cancel", onClick: () => reject() },
            { variant: "danger", label: "I understand, take me to the public repo", onClick: () => resolve() }
          ]
        })
      );
      navigate("/installer/public");
    } catch {
      // user cancelled
    }
  }

  const sectionRoutes: RouteType[] = [
    {
      name: "Dnp",
      subPath: subPaths.dnp,
      element: (
        <Routes>
          <Route index element={<InstallerDnp />} />
          <Route path=":id/*" element={<InstallDnpContainer />} />
        </Routes>
      )
    },
    {
      name: "Public",
      subPath: subPaths.public,
      element: (
        <Routes>
          <Route index element={<InstallerPublic />} />
          <Route path=":id/*" element={<InstallDnpContainer />} />
        </Routes>
      )
    }
  ];

  return (
    <>
      {/* Custom navbar with guard for "Public" */}
      {!hideNavbar && (
        <div className="horizontal-navbar">
          {routesForNavbar.map((r) => {
            const guard = r.link === "public" ? confirmPublicDappstore : undefined;
            return (
              <button key={r.subPath} className="item-container" onClick={guard}>
                <NavLink to={r.link} className="item no-a-style" style={{ whiteSpace: "nowrap" }} onClick={guard}>
                  {r.name.toUpperCase()}
                </NavLink>
              </button>
            );
          })}
        </div>
      )}

      {/* Reuse SectionNavigator */}
      <SectionNavigator routes={sectionRoutes} hideNavbar />
    </>
  );
};
