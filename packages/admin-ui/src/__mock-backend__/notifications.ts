import { PackageNotificationDb, Routes } from "@dappnode/common";

export const notifications: Pick<
  Routes,
  "notificationsGet" | "notificationsRemove" | "notificationsTest"
> = {
  notificationsGet: async () => sampleNotifications,
  notificationsRemove: async () => {},
  notificationsTest: async () => {}
};

const sampleNotifications: PackageNotificationDb[] = [
  {
    id: "notification-web3signer-gnosis.dnp.dappnode.eth",
    type: "danger",
    title: "Web3signer eth2 client selected is not available",
    body:
      "Make sure you hace selected an available client at packages > web3signer > config > eth2 client",
    timestamp: 153834826,
    viewed: false
  },
  {
    id: "diskSpaceRanOut-stoppedPackages",
    type: "danger",
    title: "Disk space ran out, stopped packages",
    body: "Available disk space gone wrong ".repeat(10),
    timestamp: 153834824,
    viewed: false
  },
  {
    id: "sample-info-notification",
    type: "info",
    title: "Something is available",
    body: `Something is available.

- Line 1
- Line 2

Final line`,
    timestamp: 153834825,
    viewed: false
  }
];
