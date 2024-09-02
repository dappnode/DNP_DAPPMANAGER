import React from "react";
import { useApi } from "api";
import { useNavigate, Route, Routes } from "react-router-dom";
import { wireguardDnpName } from "params";
import { getInstallerPath } from "pages/installer";
import { title } from "../../data";
// Components
import Alert from "react-bootstrap/esm/Alert";
import { renderResponse } from "components/SwrRender";
import { WireguardDeviceDetails } from "./WireguardDeviceDetails";
import { WireguardDevicesHome } from "./WireguardDevicesHome";
// General styles
import "./wireguard.scss";
import Title from "components/Title";

export const WireguardDevicesRoot: React.FC = () => {
  const dnpsRequest = useApi.packagesGet();
  const navigate = useNavigate();

  return renderResponse(dnpsRequest, ["Loading installed DAppNode Packages"], (dnps) => {
    const wireguardDnp = dnps.find((dnp) => dnp.dnpName === wireguardDnpName);
    if (!wireguardDnp) {
      return (
        <>
          <Title title={title} />
          <Alert variant="secondary">
            You must{" "}
            <a href="#" onClick={() => navigate(`${getInstallerPath(wireguardDnpName)}/${wireguardDnpName}`)}>
              install the Wireguard package
            </a>{" "}
            to use this feature
          </Alert>
        </>
      );
    }

    return (
      <Routes>
        <Route path={"/"} element={<WireguardDevicesHome />} />
        <Route path=":id" element={<WireguardDeviceDetails />} />
      </Routes>
    );
  });
};
