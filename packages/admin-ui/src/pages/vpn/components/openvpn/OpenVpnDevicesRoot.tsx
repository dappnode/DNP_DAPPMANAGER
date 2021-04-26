import React from "react";
import { Route, RouteComponentProps } from "react-router-dom";
// Components
import { OpenVpnDeviceDetails } from "./OpenVpnDeviceDetails";
import OpenVpnDevicesHome from "./OpenVpnDevicesHome";
// General styles
import "./openVpnDevices.scss";

export const OpenVpnDevicesRoot: React.FC<RouteComponentProps> = ({
  match
}) => {
  return (
    <>
      <Route exact path={match.path} component={OpenVpnDevicesHome} />
      <Route path={match.path + "/:id"} component={OpenVpnDeviceDetails} />
    </>
  );
};
