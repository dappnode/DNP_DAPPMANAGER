import React from "react";
import { Routes, Route } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { title, systemPackagesSubPath, myPackagesSubPath } from "../data";
// Components
import { PackagesList } from "../components/PackagesList";
import Title from "components/Title";
import { PackageById } from "./ById";
// Style
import "../components/packages.scss";

export function PackagesHome({ showCoreDnps }: { showCoreDnps: boolean }) {
  const options = [
    { name: "My packages", path: myPackagesSubPath },
    {
      name: "System packages",
      path: systemPackagesSubPath
    }
  ];

  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {options.map(option => (
          <button key={option.path} className="item-container">
            <NavLink
              to={option.path}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {option.name}
            </NavLink>
          </button>
        ))}
      </div>

      <PackagesList coreDnps={showCoreDnps} />

      <Routes>
        <Route
          path={myPackagesSubPath}
          element={<PackagesHome showCoreDnps={false} />}
        />
        <Route
          path={systemPackagesSubPath}
          element={<PackagesHome showCoreDnps={true} />}
        />
        <Route path={":id"} element={<PackageById />} />
      </Routes>
    </>
  );
}
