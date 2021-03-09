import React from "react";
import { Route, RouteComponentProps } from "react-router-dom";
// Components
import { WireguardDeviceDetails } from "./WireguardDeviceDetails";
import { WireguardDevicesHome } from "./WireguardDevicesHome";
// General styles
import "./wireguard.scss";

export const WireguardDevicesRoot: React.FC<RouteComponentProps> = ({
  match
}) => {
  return (
    <>
      <Route exact path={match.path} component={WireguardDevicesHome} />
      <Route path={match.path + "/:id"} component={WireguardDeviceDetails} />
    </>
  );
};
