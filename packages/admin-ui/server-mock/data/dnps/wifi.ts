import { MockDnp } from "./types";

export const wifi: MockDnp = {
  metadata: {
    name: "wifi.dnp.dappnode.eth",
    version: "0.2.6",
    description: "DAppNode wifi",
    type: "dncore"
  },

  installedData: {
    version: "0.2.6",
    state: "running",
    userSettings: {
      environment: {
        SSID: "DAppNodeWIFI",
        WPA_PASSPHRASE: "dappnode"
      }
    }
  }
};
