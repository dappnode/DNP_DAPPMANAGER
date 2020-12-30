import { Routes } from "common";

import { autoUpdate } from "./autoUpdate";
import { devices } from "./devices";
import { notifications } from "./notifications";
import * as packages from "./packages";
import { password } from "./password";
import * as pending from "./pending";
import { ssh } from "./ssh";
import { telegram } from "./telegram";
import { userActionLogs } from "./userActionLogs";
import { volumes } from "./volumes";

export const calls: Routes = {
  ...autoUpdate,
  ...devices,
  ...notifications,
  ...packages,
  ...password,
  ...pending,
  ...ssh,
  ...telegram,
  ...userActionLogs,
  ...volumes
};
