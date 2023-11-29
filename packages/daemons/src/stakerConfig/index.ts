import { eventBus } from "@dappnode/eventbus";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { dappnodeInstaller, packagePickItemData } from "@dappnode/installer";
import { memoizeDebounce } from "@dappnode/utils";

async function runStakerCacheUpdate({
  dnpName,
}: {
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
  normalizer: ([{ dnpName }]: [{ dnpName: string }]) => dnpName,
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
export function startStakerDaemon(): void {
  eventBus.runStakerCacheUpdate.on(({ dnpName }) => {
    memoizeDebouncedCacheUpdate({ dnpName });
  });
}
