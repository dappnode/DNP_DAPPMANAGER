/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  StakerItemOk,
  InstalledPackageDataApiReturn,
  UserSettingsAllDnps,
  MevBoost
} from "@dappnode/common";
import { MevBoostMainnet, MevBoostPrater, Network } from "@dappnode/types";
import { packageInstall, packageSetEnvironment } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";
import * as db from "../../../db/index.js";

import { parentPort, workerData } from "worker_threads";
import { setMevBoost } from "./setMevBoost.js";

setMevBoost({ ...workerData })
  .then(result => {
    if (parentPort) parentPort.postMessage("mevBoost");
  })
  .catch(err => {
    console.log(err);
    throw err;
  });
