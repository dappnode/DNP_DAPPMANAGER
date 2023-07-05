/* eslint-disable @typescript-eslint/no-unused-vars */
import { InstalledPackageDataApiReturn } from "@dappnode/common";
import { packageInstall } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";

import { parentPort, workerData } from "worker_threads";
import { setSigner } from "./setSigner.js";

setSigner({ ...workerData })
  .then(result => {
    if (parentPort) parentPort.postMessage("signer");
  })
  .catch(err => {
    console.log(err);
    throw err;
  });
