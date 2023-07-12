import React from "react";
import { Routes, Route } from "react-router-dom";
import { systemPackagesSubPath } from "./data";
// Components
import { PackagesHome } from "./pages/Home";
import { PackageById } from "./pages/ById";
// Style
import "./components/packages.scss";

export const PackagesRoot: React.FC = (
) => (
  <Routes>
    <Route path={"/"} element={<PackagesHome showCoreDnps={false} />} />
    <Route
      path={systemPackagesSubPath}
      element={<PackagesHome showCoreDnps={true} />}
    />
    <Route path={"/:id"} element={<PackageById />} />
  </Routes>
);
