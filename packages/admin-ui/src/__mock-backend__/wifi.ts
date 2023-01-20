import { Routes } from "@dappnode/common";

export const wifi: Pick<Routes, "wifiCredentialsGet" | "wifiReportGet"> = {
  wifiCredentialsGet: async () => {
    return { ssid: "DAppNodeWifi", password: "dappnode" };
  },
  wifiReportGet: async () => {
    return {
      wifiContainer: {
        containerId: "17628371823",
        containerName: "DAppNodeCore-wifi.dnp.dappnode.eth",
        dnpName: "wifi.dnp.dappnode.eth:0.2.6",
        serviceName: " wifi.dnp.dappnode.eth",
        instanceName: "",
        version: "0.0.0",
        isDnp: true,
        isCore: false,
        created: 1573712712,
        image: "mock-image",
        state: "exited",
        running: true,
        exitCode: null,
        ports: [],
        volumes: [],
        networks: [],
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: [],
        dependencies: {},
        origin: "",
        avatarUrl: ""
      },
      info: "Wifi service exited due to an internal error",
      report: {
        lastLog: "[Error] any wifi error".replace(/\[.*?\]/g, ""),
        exitCode: 57
      }
    };
  }
};
