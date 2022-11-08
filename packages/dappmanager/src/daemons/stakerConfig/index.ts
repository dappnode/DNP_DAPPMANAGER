import { eventBus } from "../../eventBus";
import * as db from "../../db";
import { logs } from "../../logs";
import { Network } from "../../types";
import {
  getStakerParamsByNetwork,
  pickStakerItemData
} from "../../modules/stakerConfig/utils";
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import { ReleaseFetcher } from "../../modules/release";

function runStakerConfigUpdate({ dnpNames }: { dnpNames: string[] }): void {
  try {
    for (const network of ["mainnet", "gnosis", "prater"] as Network[]) {
      const stakerConfig = getStakerParamsByNetwork(network);

      if (
        dnpNames.find(dnpName => dnpName === stakerConfig.currentExecClient)
      ) {
        switch (network) {
          case "mainnet":
            db.executionClientMainnet.set("");
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
    logs.info(`Updating staker item cache for ${dnpName}`);
    const releaseFetcher = new ReleaseFetcher();
    const repository = await releaseFetcher.getRelease(dnpName);
    const dataDnp = pickStakerItemData(repository);
    logs.info(`Staker data: ${dataDnp}`);
    db.stakerItemMetadata.set(dnpName, dataDnp);
  } catch (e) {
    logs.error("Error on staker cache update daemon", e);
  }
}

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
    runOnlyOneSequentially(async () => runStakerCacheUpdate({ dnpName }));
  });
}
