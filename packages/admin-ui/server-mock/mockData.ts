import { ChainData } from "../src/common";

export const coreName = "core.dnp.dappnode.eth";

/**
 * Metadatas
 * =========
 */

export const mountpoints = [
  {
    mountpoint: "",
    use: "87%",
    used: 43e9,
    total: 0,
    free: 121e9,
    vendor: "Host",
    model: "(default)"
  },
  {
    mountpoint: "/data",
    use: "68%",
    used: 380e9,
    total: 500e9,
    free: 141e9,
    vendor: "ATA",
    model: "CT500MX500SSD4"
  },
  {
    mountpoint: "/media/usb0",
    use: "1%",
    used: 992e9,
    total: 1000e9,
    free: 6.2e9,
    vendor: "SanDisk",
    model: "Ultra_USB_3.0"
  },
  {
    mountpoint: "/media/usb1",
    use: "100%",
    used: 4e9,
    total: 16e9,
    free: 7.1e9,
    vendor: "SanDisk",
    model: "Ultra_USB_3.0"
  }
];

export const hostStats = {
  cpu: "34%",
  disk: "96%",
  memory: "45%"
};

export const devices = {
  ids: ["test-name", "other-user"],
  entities: {
    "test-name": { id: "test-name", admin: true, ip: "172.10.0.1" },
    "other-user": { id: "other-user", admin: false, ip: "172.10.0.2" }
  }
};

/**
 * Actual mockState
 * ================
 */

export const chainData: ChainData[] = [
  {
    dnpName: "geth.dnp.dappnode.eth",
    syncing: true,
    error: false,
    message: [
      "Blocks synced: 543000 / 654000",
      "States pulled: 25314123 / 154762142"
    ].join("\n\n"),
    help: "http://geth.io"
  },
  {
    dnpName: "rinkeby.dnp.dappnode.eth",
    syncing: true,
    error: false,
    message: "Blocks synced: 543000 / 654000",
    progress: 0.83027522935
  }
];
