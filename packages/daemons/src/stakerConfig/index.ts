import { eventBus } from "@dappnode/eventbus";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { ReleaseFetcher, packagePickItemData } from "@dappnode/installer";
import { memoizeDebounce } from "@dappnode/utils";

async function runStakerCacheUpdate({
  dnpName
}: {
  dnpName: string;
}): Promise<void> {
  try {
    const releaseFetcher = new ReleaseFetcher();
    const repository = await releaseFetcher.getRelease(dnpName);
    const dataDnp = packagePickItemData(repository);
    db.pkgItemMetadata.set(dnpName, dataDnp);
  } catch (e) {
    logs.error("Error on staker cache update daemon", e);
  }
}

// Create a cache key for memoize based on the dnpName
const memoizeDebounceCacheUpdateResolver = ({ dnpName }: { dnpName: string }) =>
  dnpName;

const memoizeDebouncedCacheUpdate = memoizeDebounce(
  runStakerCacheUpdate,
  60 * 1000 * 30,
  { maxWait: 60 * 1000 * 30, leading: true, trailing: false },
  memoizeDebounceCacheUpdateResolver
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
