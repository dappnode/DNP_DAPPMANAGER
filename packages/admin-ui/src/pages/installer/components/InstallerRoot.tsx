import React from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
// Components
import InstallDnpContainer from "./InstallDnpContainer";
import { title, subPaths } from "../data";
import Title from "components/Title";
import { InstallerDnp } from "./dappnodeDappstore/InstallerDnp";
import { InstallerPublic } from "./publicDappstore/InstallerPublic";
import { confirm } from "components/ConfirmDialog";
// Styles
import "./installer.scss";

const InstallerRoot: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routes: {
    name: string;
    subPath: string;
    subLink: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            {
              variant: "dappnode",
              label: "Cancel",
              onClick: () => reject()
            },
            {
              variant: "danger",
              label: "I understand, take me to the public repo",
              onClick: () => resolve()
            }
          ]
        })
      );
      navigate("/installer/public");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // do nothing
    }
  }

  // Do not show the horizontal navbar in the following paths: /installer/dnp/:id/* and /installer/public/:id/*
  // it looks weird and it is not needed
  const hideNavbarPattern = /\/installer\/(dnp|public)\/.+/;
  const hideNavbar = hideNavbarPattern.test(location.pathname);

  return (
    <>
      <Title title={title} />

      {!hideNavbar && (
        <div className="horizontal-navbar">
          {routes.map((option) => (
            <button
              key={option.subPath}
              className="item-container"
              onClick={option.subLink === "public" ? confirmPublicDappstore : undefined}
            >
              <NavLink
                to={option.subLink}
                className="item no-a-style"
                style={{
                  whiteSpace: "nowrap"
                }}
                onClick={option.subLink === "public" ? confirmPublicDappstore : undefined}
              >
                {option.name}
              </NavLink>
            </button>
          ))}
        </div>
      )}

      <Routes>
        {routes.map((route) => (
          <Route
            key={route.subPath}
            path={route.subPath}
            element={
              <Routes>
                <Route index element={<route.component />} />
                <Route path=":id/:version?/*" element={<InstallDnpContainer />} />
              </Routes>
            }
          />
        ))}
      </Routes>
    </>
  );
};

export default InstallerRoot;
