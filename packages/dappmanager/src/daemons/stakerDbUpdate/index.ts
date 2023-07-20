import { eventBus } from "../../eventBus.js";
import { mevBoostMainnet, mevBoostPrater, stakerPkgs } from "@dappnode/types";
import * as db from "../../db/index.js";
import { logger } from "ethers";

async function removeStakerPkgsFromDbIfSelected({
  dnpNames
}: {
  dnpNames?: string[];
}): Promise<void> {
  if (!dnpNames) return;
  dnpNames.forEach(dnpName => {
    switch (dnpName) {
      case db.executionClientMainnet.get():
        db.executionClientMainnet.set(undefined);
        break;
      case db.executionClientGnosis.get():
        db.executionClientGnosis.set(undefined);
        break;
      case db.executionClientPrater.get():
        db.executionClientPrater.set(undefined);
        break;
      case db.consensusClientMainnet.get():
        db.consensusClientMainnet.set(undefined);
        break;
      case db.consensusClientGnosis.get():
        db.consensusClientGnosis.set(undefined);
        break;
      case db.consensusClientPrater.get():
        db.consensusClientPrater.set(undefined);
        break;
      case "mev-boost.dnp.dappnode.eth":
        db.mevBoostMainnet.set(false);
        break;
      case "mev-boost-goerli.dnp.dappnode.eth":
        db.mevBoostPrater.set(false);
        break;
      default:
        break;
    }
  });

  logger.info(`Removed clients/mev-boost ${dnpNames} from main DB`);
}

/**
 * stakerDbUpdate daemon.
 * Makes sure the main DB is updated when any package selected in the stakers is removed
 */
export function startStakerDbUpdateDaemon(): void {
  eventBus.packagesModified.on(({ dnpNames, removed }) => {
    logger.debug(
      `packagesModified event received in removeStakerPkgsFromDbIfSelected daemon: ${dnpNames}`
    );
    if (removed) {
      removeStakerPkgsFromDbIfSelected({ dnpNames });
    }
  });
}
