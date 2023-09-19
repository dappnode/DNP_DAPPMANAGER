import { eventBus } from "../../eventBus.js";
import * as db from "../../db/index.js";
import { logs } from "@dappnode/logger";
import { pickStakerItemData } from "../../modules/stakerConfig/utils.js";
import { ReleaseFetcher } from "../../modules/release/index.js";
import { memoizeDebounce } from "../../utils/asyncFlows.js";

async function runStakerCacheUpdate({
  dnpName
}: {
  dnpName: string;
}): Promise<void> {
  try {
    const releaseFetcher = new ReleaseFetcher();
    const repository = await releaseFetcher.getRelease(dnpName);
    const dataDnp = pickStakerItemData(repository);
    db.stakerItemMetadata.set(dnpName, dataDnp);
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
