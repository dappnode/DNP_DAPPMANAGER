import { eventBus } from "../../eventBus";
import * as db from "../../db";
import { logs } from "../../logs";
import { pickStakerItemData } from "../../modules/stakerConfig/utils";
import { stakerParamsByNetwork } from "../../modules/stakerConfig/stakerParamsByNetwork";
import { ReleaseFetcher } from "../../modules/release";
import { memoizeDebounce } from "../../utils/asyncFlows";
import { EthClientRemote, Network } from "../../types";

function runStakerConfigUpdate({ dnpNames }: { dnpNames: string[] }): void {
  try {
    for (const network of ["mainnet", "gnosis", "prater"] as Network[]) {
      const stakerConfig = stakerParamsByNetwork(network);

      if (
        dnpNames.find(dnpName => dnpName === stakerConfig.currentExecClient)
      ) {
        switch (network) {
          case "mainnet":
            db.executionClientMainnet.set("");
            // Set ETH repository to remote, EC cannot sync without CC
            db.ethClientRemote.set(EthClientRemote.on);
          case "gnosis":
            db.executionClientGnosis.set("");
          case "prater":
            db.executionClientPrater.set("");
        }
      }

      if (
        dnpNames.find(dnpName => dnpName === stakerConfig.currentConsClient)
      ) {
        switch (network) {
          case "mainnet":
            db.consensusClientMainnet.set("");
            // Set ETH repository to remote
            db.ethClientRemote.set(EthClientRemote.on);
          case "gnosis":
            db.consensusClientGnosis.set("");
          case "prater":
            db.consensusClientPrater.set("");
        }
      }

      if (dnpNames.find(dnpName => dnpName === stakerConfig.mevBoost)) {
        switch (network) {
          case "mainnet":
            db.mevBoostMainnet.set(false);
          case "gnosis":
            db.mevBoostGnosis.set(false);
          case "prater":
            db.mevBoostPrater.set(false);
        }
      }
    }
  } catch (e) {
    logs.error("Error on stakerConfig interval", e);
  }
}

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
 * Makes sure the staker config is updated when removing a package
 */
export function startStakerDaemon(): void {
  eventBus.packagesModified.on(({ dnpNames, removed }) => {
    // Only act when removing packages
    if (removed) runStakerConfigUpdate({ dnpNames });
  });

  eventBus.runStakerCacheUpdate.on(({ dnpName }) => {
    memoizeDebouncedCacheUpdate({ dnpName });
  });
}
