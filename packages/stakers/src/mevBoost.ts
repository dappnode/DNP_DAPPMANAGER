import { Network, StakerItem, UserSettingsAllDnps } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller, packageGet } from "@dappnode/installer";
import * as db from "@dappnode/db";

export class MevBoost extends StakerComponent {
  protected belongsToStakerNetwork = false;
  protected static readonly DbHandlers: Record<
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
      dnpName: "mev-boost.dnp.dappnode.eth",
      minVersion: "0.1.0",
    },
    [Network.Gnosis]: null,
    [Network.Prater]: {
      dnpName: "mev-boost-goerli.dnp.dappnode.eth",
      minVersion: "0.1.0",
    },
    [Network.Holesky]: {
      dnpName: "mev-boost-holesky.dnp.dappnode.eth",
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
      currentClient: MevBoost.DbHandlers[network].get(),
      relays: await this.getMevBoostCurrentRelays(mevBoostDnpName),
    });
  }

  async getMevBoostCurrentRelays(mevBoostDnpName?: string): Promise<string[]> {
    const relays: string[] = [];
    if (!mevBoostDnpName) return relays;
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
      belongsToStakerNetwork: this.belongsToStakerNetwork,
      userSettings: this.getMevBoostNewUserSettings(
        newMevBoostDnpName,
        newRelays
      ),
    });
    // persist on db
    if (Boolean(newMevBoostDnpName) !== MevBoost.DbHandlers[network].get())
      await MevBoost.DbHandlers[network].set(newMevBoostDnpName ? true : false);
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
