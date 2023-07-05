/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConsensusClient,
  StakerItemOk,
  InstalledPackageDataApiReturn,
  UserSettingsAllDnps
} from "@dappnode/common";
import { packageInstall, packageSetEnvironment } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { listPackageNoThrow } from "../../docker/list/index.js";
import { getConsensusUserSettings } from "../utils.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";
import * as db from "../../../db/index.js";
import {
  ConsensusClientGnosis,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  Network
} from "@dappnode/types";

import { parentPort, workerData } from "worker_threads";
import { setConsensusClient } from "./setConsensusClient.js";

setConsensusClient({ ...workerData })
  .then(result => {
    if (parentPort) parentPort.postMessage("consensus");
  })
  .catch(err => {
    console.log(err);
    throw err;
  });
