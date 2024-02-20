import React from "react";
import { Route, Routes } from "react-router-dom";
// Components
import { OpenVpnDeviceDetails } from "./OpenVpnDeviceDetails";
import OpenVpnDevicesHome from "./OpenVpnDevicesHome";
// General styles
import "./openVpnDevices.scss";

export const OpenVpnDevicesRoot: React.FC = () => {
  return (
    <Routes>
      <Route path={"/"} element={<OpenVpnDevicesHome />} />
      <Route path=":id" element={<OpenVpnDeviceDetails />} />
    </Routes>
  );
};
