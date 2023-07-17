import React from "react";
import { Routes, Route } from "react-router-dom";
// Components
import InstallDnpContainer from "./InstallDnpContainer";
import { title, rootPath, subPathPublic } from "../data";
import Title from "components/Title";
import { InstallerDnp } from "./dappnodeDappstore/InstallerDnp";
import { InstallerPublic } from "./publicDappstore/InstallerPublic";
// Styles
import "./installer.scss";
const InstallerRoot: React.FC = () => {
  return (
    <>
      <Title title={title} />

      <Routes>
        {/*Root path: dappstore dnp*/}
        <Route key={rootPath} path={"/"} element={<InstallerDnp />} />
        {/*Public path: dappstore public*/}
        <Route
          key={subPathPublic}
          path={subPathPublic}
          element={<InstallerPublic />}
        />
        {/*DNP installer path*/}
        <Route path={"/:id"} element={<InstallDnpContainer />} />
      </Routes>
    </>
  );
};

export default InstallerRoot;
