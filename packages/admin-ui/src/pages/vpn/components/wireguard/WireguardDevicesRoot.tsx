import React from "react";
import { useApi } from "api";
import { NavLink, Route } from "react-router-dom";
import { wireguardDnpName } from "params";
import { rootPath as installedRootPath } from "pages/installer";
import { urlJoin } from "utils/url";
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

  return renderResponse(
    dnpsRequest,
    ["Loading installed DAppNode Packages"],
    dnps => {
      const wireguardDnp = dnps.find(dnp => dnp.dnpName === wireguardDnpName);
      if (!wireguardDnp) {
        const url = urlJoin(installedRootPath, wireguardDnpName);
        return (
          <>
            <Title title={title} />
            <Alert variant="secondary">
              You must <NavLink to={url}>install the Wireguard package</NavLink>{" "}
              to use this feature
            </Alert>
          </>
        );
      }

      return (
        <>
          <Route path={"/"} element={<WireguardDevicesHome />} />
          <Route
            path={"/:id"}
            element={<WireguardDeviceDetails />}
          />
        </>
      );
    }
  );
};
