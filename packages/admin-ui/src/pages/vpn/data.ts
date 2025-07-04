// This will be used later in our root reducer and selectors
export const relativePath = "vpn/tailscale"; // default redirect to tailscale vpn
export const rootPath = "vpn/*";
export const title = "VPN";
export const openVpnSubtitle = "Open-VPN";
export const wireguardSubtitle = "Wireguard";

// Subpaths
export const subPaths = {
  openVpn: "openvpn/*",
  wireguard: "wireguard/*",
  tailscale: "tailscale/*"
};

// Additional data
export const maxIdLength = 80;
