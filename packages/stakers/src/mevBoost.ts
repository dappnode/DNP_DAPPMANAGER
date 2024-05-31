import { Network, StakerItem, UserSettingsAllDnps } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
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
    const mevBoost = MevBoost.CompatibleMevBoost[network]?.dnpName;
    return await super.getAll(
      mevBoost ? [mevBoost] : [],
      MevBoost.DbHandlers[network].get()
    );
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
      userSettings: this.getMevBoostUserSettings(newMevBoostDnpName, newRelays),
    });
    // persist on db
    if (Boolean(newMevBoostDnpName) !== MevBoost.DbHandlers[network].get())
      await MevBoost.DbHandlers[network].set(newMevBoostDnpName ? true : false);
  }

  private getMevBoostUserSettings(
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
