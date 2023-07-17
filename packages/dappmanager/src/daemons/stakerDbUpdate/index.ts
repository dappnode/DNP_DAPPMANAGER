import { eventBus } from "../../eventBus.js";
import { stakerPkgs } from "@dappnode/types";

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
    // TODO: For each DNP, remove it from DB if it is selected in the stakers config
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
