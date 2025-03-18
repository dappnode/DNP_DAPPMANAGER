import { eventBus } from "@dappnode/eventbus";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { DappnodeInstaller, packagePickItemData } from "@dappnode/installer";
import { memoizeDebounce } from "@dappnode/utils";
import { MevBoostHolesky, MevBoostHoodie, MevBoostMainnet, MevBoostPrater } from "@dappnode/types";

async function updateMevBoostOnDb({ dnpNames, removed }: { dnpNames: string[]; removed?: boolean }): Promise<void> {
  try {
    if (!removed) return;
    if (dnpNames.includes(MevBoostMainnet.Mevboost)) await db.mevBoostMainnet.set(false);
    if (dnpNames.includes(MevBoostPrater.Mevboost)) await db.mevBoostPrater.set(false);
    if (dnpNames.includes(MevBoostHolesky.Mevboost)) await db.mevBoostHolesky.set(false);
    if (dnpNames.includes(MevBoostHoodie.Mevboost)) await db.mevBoostHoodie.set(false);
  } catch (e) {
    logs.error("Error updating mev boost on db", e);
  }
}

async function runStakerCacheUpdate({
  dappnodeInstaller,
  dnpName
}: {
  dappnodeInstaller: DappnodeInstaller;
  dnpName: string;
}): Promise<void> {
  try {
    const repository = await dappnodeInstaller.getRelease(dnpName);
    const dataDnp = packagePickItemData(repository);
    db.pkgItemMetadata.set(dnpName, dataDnp);
  } catch (e) {
    logs.error("Error on staker cache update daemon", e);
  }
}

// Define the memoize options with a normalizer function
const memoizeOptions = {
  normalizer: ([{ dnpName }]: [{ dnpName: string }]) => dnpName
};

const memoizeDebouncedCacheUpdate = memoizeDebounce(
  runStakerCacheUpdate,
  60 * 1000 * 30, // 30 minutes
  { maxWait: 60 * 1000 * 30, leading: true, trailing: false },
  memoizeOptions // Pass the options object
);

/**
 * StakerConfig daemon.
 * Makes sure the staker config cache is executed maximum 1 per 30 mins
 */
export function startStakerDaemon(dappnodeInstaller: DappnodeInstaller): void {
  eventBus.runStakerCacheUpdate.on(({ dnpName }) => {
    memoizeDebouncedCacheUpdate({ dappnodeInstaller, dnpName });
  });

  eventBus.packagesModified.on((dnpNames) => {
    updateMevBoostOnDb(dnpNames);
  });
}
