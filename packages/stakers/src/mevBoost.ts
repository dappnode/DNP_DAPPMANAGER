import {
  MevBoostHolesky,
  MevBoostMainnet,
  MevBoostPrater,
  Network,
  StakerItem,
  UserSettingsAllDnps,
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller, packageGet } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { listPackageNoThrow } from "@dappnode/dockerapi";

export class MevBoost extends StakerComponent {
  protected static readonly BelongsToStakerNetwork = false;
  readonly DbHandlers: Record<
    Network,
    { get: () => boolean; set: (globEnvValue: boolean) => Promise<void> }
  > = {
    [Network.Mainnet]: db.mevBoostMainnet,
    [Network.Gnosis]: db.mevBoostGnosis,
    [Network.Prater]: db.mevBoostPrater,
    [Network.Holesky]: db.mevBoostHolesky,
    [Network.Lukso]: db.mevBoostLukso,
  };

  protected static readonly CompatibleMevBoost: Record<
    Network,
    { dnpName: string; minVersion: string } | null
  > = {
    [Network.Mainnet]: {
      dnpName: MevBoostMainnet.Mevboost,
      minVersion: "0.1.0",
    },
    [Network.Gnosis]: null,
    [Network.Prater]: {
      dnpName: MevBoostPrater.Mevboost,
      minVersion: "0.1.0",
    },
    [Network.Holesky]: {
      dnpName: MevBoostHolesky.Mevboost,
      minVersion: "0.1.0",
    },
    [Network.Lukso]: null,
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllMevBoost(network: Network): Promise<StakerItem[]> {
    const mevBoostDnpName = MevBoost.CompatibleMevBoost[network]?.dnpName;
    return await super.getAll({
      dnpNames: mevBoostDnpName ? [mevBoostDnpName] : [],
      currentClient: this.DbHandlers[network].get(),
      relays: await this.getMevBoostCurrentRelays(mevBoostDnpName),
    });
  }

  async getMevBoostCurrentRelays(mevBoostDnpName?: string): Promise<string[]> {
    const relays: string[] = [];
    if (
      !mevBoostDnpName ||
      !(await listPackageNoThrow({ dnpName: mevBoostDnpName }))
    )
      return relays;
    const pkgEnv = (await packageGet({ dnpName: mevBoostDnpName })).userSettings
      ?.environment;
    if (pkgEnv) {
      pkgEnv["mev-boost"]["RELAYS"]
        .split(",")
        .forEach((relay) => relays.push(relay));
    }
    return relays;
  }

  async setNewMevBoost(
    network: Network,
    newMevBoostDnpName: string | null,
    newRelays: string[]
  ) {
    const compatibleMevBoost = MevBoost.CompatibleMevBoost[network];
    await super.setNew({
      newStakerDnpName: newMevBoostDnpName,
      compatibleClients: compatibleMevBoost ? [compatibleMevBoost] : null,
      belongsToStakerNetwork: MevBoost.BelongsToStakerNetwork,
      userSettings: this.getMevBoostNewUserSettings(
        newMevBoostDnpName,
        newRelays
      ),
    });
    // persist on db
    if (Boolean(newMevBoostDnpName) !== this.DbHandlers[network].get())
      await this.DbHandlers[network].set(newMevBoostDnpName ? true : false);
  }

  private getMevBoostNewUserSettings(
    newMevBoostDnpName: string | null,
    newRelays: string[]
  ): UserSettingsAllDnps {
    return newMevBoostDnpName
      ? {
          [newMevBoostDnpName]: {
            environment: {
              "mev-boost": {
                ["RELAYS"]:
                  newRelays
                    .join(",")
                    .trim()
                    .replace(/(^,)|(,$)/g, "") || "",
              },
            },
          },
        }
      : {};
  }
}
