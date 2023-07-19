import { eventBus } from "../../eventBus.js";
import { mevBoostMainnet, mevBoostPrater, stakerPkgs } from "@dappnode/types";
import * as db from "../../db/index.js";

async function removeStakerPkgsFromDbIfSelected({
  dnpNames
}: {
  dnpNames?: string[];
}): Promise<void> {
  // Only leave the dnpName included in stakerPkgs
  dnpNames =
    dnpNames?.filter(dnpName =>
      stakerPkgs.some(stakerPkg => stakerPkg === dnpName)
    ) || [];

  if (dnpNames.length === 0) return;

  dnpNames.forEach(dnpName => {
    switch (dnpName) {
      case db.executionClientMainnet.get():
        db.executionClientMainnet.set(null);
        break;
      case db.executionClientGnosis.get():
        db.executionClientGnosis.set(null);
        break;
      case db.executionClientPrater.get():
        db.executionClientPrater.set(null);
        break;
      case db.consensusClientMainnet.get():
        db.consensusClientMainnet.set(null);
        break;
      case db.consensusClientGnosis.get():
        db.consensusClientGnosis.set(null);
        break;
      case db.consensusClientPrater.get():
        db.consensusClientPrater.set(null);
        break;
      case mevBoostMainnet[0]:
        db.mevBoostMainnet.set(false);
        break;
      case mevBoostPrater[0]:
        db.mevBoostPrater.set(false);
        break;
      default:
        break;
    }
  });
}

/**
 * stakerDbUpdate daemon.
 * Makes sure the main DB is updated when any package selected in the stakers is removed
 */
export function startStakerDbUpdateDaemon(/*signal: AbortSignal*/): void {
  eventBus.packagesModified.on(({ dnpNames, removed }) => {
    if (removed) {
      removeStakerPkgsFromDbIfSelected({ dnpNames });
    }
  });

  /*runAtMostEvery(
    async () => removeStakerPkgsFromDbIfSelected({}),
    params.STAKER_DB_UPDATE_INTERVAL,
    signal
  );*/
}
