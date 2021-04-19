import { Routes } from "../../src/common";

export const wifi: Pick<Routes, "wifiCredentialsGet" | "wifiReportGet"> = {
  wifiCredentialsGet: async () => {
    return { ssid: "DAppNodeWifi", password: "dappnode" };
  },
  wifiReportGet: async () => {
    return {
      containerState: "running",
      info: "Wifi is currently running"
    };
  }
};
