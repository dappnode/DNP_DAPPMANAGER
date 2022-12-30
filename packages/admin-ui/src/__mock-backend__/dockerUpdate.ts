import { Routes } from "@dappnode/common";
import { pause } from "./utils/pause";

let dockerComposeUpdated = false;
let dockerEngineUpdated = false;

export const dockerUpdate: Pick<
  Routes,
  | "dockerComposeUpdate"
  | "dockerComposeUpdateCheck"
  | "dockerEngineUpdate"
  | "dockerEngineUpdateCheck"
> = {
  dockerComposeUpdate: async () => {
    await pause(5 * 1000);
    dockerComposeUpdated = true;
    return "Updated";
  },
  dockerComposeUpdateCheck: async () => {
    await pause(1 * 1000);
    return dockerComposeUpdated
      ? {
          updated: true,
          version: "2.2.2",
          requirements: []
        }
      : {
          updated: false,
          version: "1.1.1",
          requirements: [
            {
              isFulFilled: true,
              title: "Compatibility",
              message: "Engine and compose compatible",
              errorMessage: "Must be compatible"
            }
          ]
        };
  },

  dockerEngineUpdate: async () => {
    await pause(5 * 1000);
    dockerEngineUpdated = true;
    return "Updated";
  },
  dockerEngineUpdateCheck: async () => {
    await pause(1 * 1000);
    return dockerEngineUpdated
      ? {
          updated: true,
          version: "2.2.2",
          requirements: []
        }
      : {
          updated: false,
          version: "1.1.1",
          requirements: [
            {
              isFulFilled: true,
              title: "Operating System (OS)",
              message: "OS debian supported"
            },
            {
              isFulFilled: true,
              title: "OS Architecture",
              message: "Arch amd64 supported"
            },
            {
              isFulFilled: true,
              title: "OS release",
              message: "Debian release buster supported"
            },
            {
              isFulFilled: dockerComposeUpdated,
              title: "Docker compose compatibility",
              message: dockerComposeUpdated
                ? "Docker compose is updated"
                : "You must update Docker compose first. Current version 1.1.1, target version 2.2.2"
            }
          ]
        };
  }
};
