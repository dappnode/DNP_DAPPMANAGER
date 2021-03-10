import React from "react";
import { useApi } from "api";
import { NavLink, Route, RouteComponentProps } from "react-router-dom";
import { wireguardDnpName } from "params";
import { rootPath as installedRootPath } from "pages/installer";
import { urlJoin } from "utils/url";
import { title } from "../data";
// Components
import Alert from "react-bootstrap/esm/Alert";
import { renderResponse } from "components/SwrRender";
import { WireguardDeviceDetails } from "./WireguardDeviceDetails";
import { WireguardDevicesHome } from "./WireguardDevicesHome";
// General styles
import "./wireguard.scss";
import Title from "components/Title";

export const WireguardDevicesRoot: React.FC<RouteComponentProps> = ({
  match
}) => {
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
              You must <NavLink to={url}>install the HTTPs Portal</NavLink> to
              use this feature
            </Alert>
          </>
        );
      }

      return (
        <>
          <Route exact path={match.path} component={WireguardDevicesHome} />
          <Route
            path={match.path + "/:id"}
            component={WireguardDeviceDetails}
          />
        </>
      );
    }
  );
};
