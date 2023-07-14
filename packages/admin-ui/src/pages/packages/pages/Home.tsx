import React from "react";
import { NavLink } from "react-router-dom";
import { title, relativePath, systemPackagesSubPath } from "../data";
// Components
import { PackagesList } from "../components/PackagesList";
import Title from "components/Title";

export function PackagesHome({ showCoreDnps }: { showCoreDnps: boolean }) {
  const options = [
    { name: "My packages", path: relativePath },
    {
      name: "System packages",
      path: relativePath + "/" + systemPackagesSubPath
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
    </>
  );
}
