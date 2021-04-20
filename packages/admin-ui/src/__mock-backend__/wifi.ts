import { Routes } from "../../src/common";

export const wifi: Pick<Routes, "wifiCredentialsGet" | "wifiReportGet"> = {
  wifiCredentialsGet: async () => {
    return { ssid: "DAppNodeWifi", password: "dappnode" };
  },
  wifiReportGet: async () => {
    return {
      containerState: "exited",
      info: "Wifi service exited due to an internal error",
      report: {
        lastLog: "[Warning] No interface found after 60s, stopping gracefully",
        exitCode: 0
      }
    };
  }
};
