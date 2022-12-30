import { Routes } from "@dappnode/common";

let sshPort = 22;
let sshStatus: "enabled" | "disabled" = "enabled";

export const ssh: Pick<
  Routes,
  "sshPortGet" | "sshPortSet" | "sshStatusGet" | "sshStatusSet"
> = {
  sshPortGet: async () => sshPort,
  sshPortSet: async ({ port }) => {
    sshPort = port;
  },
  sshStatusGet: async () => sshStatus,
  sshStatusSet: async ({ status }) => {
    sshStatus = status;
  }
};
