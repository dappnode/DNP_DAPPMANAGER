import React from "react";
import { Route, RouteComponentProps } from "react-router-dom";
// Components
import { DeviceDetails } from "./DeviceDetails";
import DevicesHome from "./DevicesHome";
// General styles
import "./devices.css";

export const DevicesRoot: React.FC<RouteComponentProps> = ({ match }) => {
  return (
    <>
      <Route exact path={match.path} component={DevicesHome} />
      <Route path={match.path + "/:id"} component={DeviceDetails} />
    </>
  );
};
