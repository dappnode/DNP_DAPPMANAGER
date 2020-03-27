import * as db from "../../db";
import * as eventBus from "../../eventBus";
import { EthClientStatus } from "../../types";

// Create alias to make the main functions more flexible and readable

export const getTarget = db.ethClientTarget.get;
export const setTarget = db.ethClientTarget.set;
export const getStatus = db.ethClientStatus.get;
export const getFallbackOn = db.ethClientFallbackOn.get;

export const setStatus = (status: EthClientStatus, e?: Error): void => {
  db.setEthClientStatusAndError(status, e);
  eventBus.requestSystemInfo.emit(); // Update UI with new status
};

export const setFullnodeDomainTarget = (dnpName: string): void => {
  db.fullnodeDomainTarget.set(dnpName);
  eventBus.packagesModified.emit({ ids: [dnpName] }); // Run nsupdate
};
