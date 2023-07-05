/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ExecutionClient,
  StakerItemOk,
  InstalledPackageDataApiReturn
} from "@dappnode/common";
import { packageInstall } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { listPackageNoThrow } from "../../docker/list/index.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";
import {
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  Network
} from "@dappnode/types";
import * as db from "../../../db/index.js";

import { parentPort, workerData } from "worker_threads";
import { setExecutionClient } from "./setExecutionClient.js";

setExecutionClient({ ...workerData })
  .then(result => {
    if (parentPort) parentPort.postMessage("execution");
  })
  .catch(err => {
    console.log(err);
    throw err;
  });
