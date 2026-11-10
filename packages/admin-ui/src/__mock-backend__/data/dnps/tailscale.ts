import type { MockDnp } from "./types";

export const tailscale: MockDnp = {
  manifest: {
    name: "tailscale.dnp.dappnode.eth",
    version: "0.1.0",
    description: "Tailscale with browser sign-in and a status reporter",
    type: "service"
  },
  installedContainers: { tailscale: { state: "running" }, reporter: { state: "running" } },
  installedData: {
    packageSentData: {
      "tailscale.status": JSON.stringify({
        version: 1,
        state: "NeedsLogin",
        online: false,
        authUrl: "https://login.tailscale.com/a/MOCK-ONLY?demo=one&next=%2Fdevices%3Fx%3D1",
        updatedAt: Math.floor(Date.now() / 1000)
      })
    }
  },
  userSettings: { environment: { tailscale: { TS_AUTHKEY: "", TS_ROUTES: "172.33.0.0/16,10.20.0.0/24" } } },
  setupWizard: {
    version: "2",
    fields: [
      {
        id: "TS_AUTHKEY",
        required: false,
        secret: true,
        title: "Tailscale auth key (optional)",
        description: "Leave empty for browser sign-in. Clear rejected keys and restart the package.",
        target: { type: "environment", service: "tailscale", name: "TS_AUTHKEY" }
      }
    ]
  }
};
