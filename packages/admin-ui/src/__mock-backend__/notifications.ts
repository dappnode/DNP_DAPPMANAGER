import { PackageNotificationDb, Routes } from "../common";

export const notifications: Pick<
  Routes,
  "notificationsGet" | "notificationsRemove" | "notificationsTest"
> = {
  notificationsGet: async () => [sampleNotification],
  notificationsRemove: async () => {},
  notificationsTest: async () => {}
};

const sampleNotification: PackageNotificationDb = {
  id: "diskSpaceRanOut-stoppedPackages",
  type: "danger",
  title: "Disk space ran out, stopped packages",
  body: "Available disk space gone wrong ".repeat(10),
  timestamp: 153834824,
  viewed: false
};
