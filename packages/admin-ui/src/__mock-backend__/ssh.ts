import { Routes } from "../common";

let sshStatus: "enabled" | "disabled" = "enabled";

export const ssh: Pick<
  Routes,
  "sshPortChange" | "sshStatusGet" | "sshStatusSet"
> = {
  sshPortChange: async () => {},
  sshStatusGet: async () => sshStatus,
  sshStatusSet: async ({ status }) => {
    sshStatus = status;
  }
};
