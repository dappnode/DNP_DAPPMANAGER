import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { VpnServicesList } from "./VpnServicesList";
import { TailscaleSection } from "./TailscaleSection";
import { OpenVpnDevicesHome } from "./openvpn/OpenVpnDevicesHome";
import { OpenVpnDeviceDetails } from "./openvpn/OpenVpnDeviceDetails";
import { WireguardDevicesHome } from "./wireguard/WireguardDevicesHome";
import { WireguardDeviceDetails } from "./wireguard/WireguardDeviceDetails";

/**
 * VPN Tab — shows a list of VPN services with nested routes for
 * device management (Tailscale config, OpenVPN devices, Wireguard devices).
 */
export function VpnTab() {
  return (
    <Routes>
      {/* Default: service list overview */}
      <Route index element={<VpnServicesList />} />

      {/* Tailscale */}
      <Route path="tailscale" element={<TailscaleSection />} />

      {/* OpenVPN */}
      <Route path="openvpn" element={<OpenVpnDevicesHome />} />
      <Route path="openvpn/:id" element={<OpenVpnDeviceDetails />} />

      {/* Wireguard */}
      <Route path="wireguard" element={<WireguardDevicesHome />} />
      <Route path="wireguard/:id" element={<WireguardDeviceDetails />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
