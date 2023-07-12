import React, { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
// Components
import InstallDnpContainer from "./InstallDnpContainer";
import { title, rootPath, subPathPublic } from "../data";
import Title from "components/Title";
import { InstallerDnp } from "./dappnodeDappstore/InstallerDnp";
import { InstallerPublic } from "./publicDappstore/InstallerPublic";
// Styles
import "./installer.scss";
const InstallerRoot: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(rootPath);
  }, [navigate]);
  return (
    <>
      <Title title={title} />

      <Routes>
        {/*Root path: dappstore dnp*/}
        <Route
          key={rootPath}
          path={location.pathname}
          element={<InstallerDnp />}
        />
        {/*Public path: dappstore public*/}
        <Route
          key={subPathPublic}
          path={location.pathname + subPathPublic}
          element={<InstallerPublic />}
        />
        {/*DNP installer path*/}
        <Route path={location.pathname + "/:id"} element={<InstallDnpContainer />} />
      </Routes>
    </>
  );
};

export default InstallerRoot;
