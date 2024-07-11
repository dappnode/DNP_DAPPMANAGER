import {
  MevBoostHolesky,
  MevBoostMainnet,
  MevBoostPrater,
  Network,
  StakerItem,
  UserSettings,
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { ComposeFileEditor } from "@dappnode/dockercompose";

export class MevBoost extends StakerComponent {
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
    const pkgEnv = new ComposeFileEditor(
      mevBoostDnpName,
      false
    ).getUserSettings().environment;
    if (pkgEnv) {
      pkgEnv["mev-boost"]["RELAYS"]
        .split(",")
        .forEach((relay) => relays.push(relay));
    }
    return relays;
  }

  async persistMevBoostIfInstalledAndRunning(network: Network): Promise<void> {
    const currentMevBoostDnpName =
      MevBoost.CompatibleMevBoost[network]?.dnpName;
    if (currentMevBoostDnpName) {
      const isInstalledAndRunning = (
        await listPackageNoThrow({
          dnpName: currentMevBoostDnpName,
        })
      )?.containers.some((container) => container.running);

      if (!isInstalledAndRunning) {
        this.DbHandlers[network].set(false);
        return;
      }
      await this.persistSelectedIfInstalled({
        dnpName: currentMevBoostDnpName,
        userSettings: this.getUserSettings([], false, network),
      });
      this.DbHandlers[network].set(true);
    }
  }

  async setNewMevBoost(
    network: Network,
    newMevBoostDnpName: string | null,
    newRelays: string[]
  ) {
    const compatibleMevBoost = MevBoost.CompatibleMevBoost[network];
    await super.setNew({
      newStakerDnpName: newMevBoostDnpName,
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      compatibleClients: compatibleMevBoost ? [compatibleMevBoost] : null,
      userSettings: newMevBoostDnpName
        ? this.getUserSettings(newRelays, true, network)
        : {},
      prevClient: compatibleMevBoost ? compatibleMevBoost.dnpName : null,
    });
    // persist on db
    if (Boolean(newMevBoostDnpName) !== this.DbHandlers[network].get())
      await this.DbHandlers[network].set(newMevBoostDnpName ? true : false);
  }

  private getUserSettings(
    newRelays: string[],
    shouldSetEnvironment: boolean,
    network: Network
  ): UserSettings {
    return {
      environment: shouldSetEnvironment
        ? {
            "mev-boost": {
              ["RELAYS"]:
                newRelays
                  .join(",")
                  .trim()
                  .replace(/(^,)|(,$)/g, "") || "",
            },
          }
        : {},
      networks: {
        rootNetworks: {
          [params.DOCKER_STAKER_NETWORKS[network]]: {
            external: true,
          },
          [params.DOCKER_PRIVATE_NETWORK_NAME]: {
            external: true,
          },
        },
        serviceNetworks: {
          ["mev-boost"]: {
            [params.DOCKER_STAKER_NETWORKS[network]]: {
              aliases: [`mev-boost.${network}.staker.dappnode`],
            },
            [params.DOCKER_PRIVATE_NETWORK_NAME]: {
              aliases: [`mev-boost.${network}.dncore.dappnode`],
            },
          },
        },
      },
    };
  }
}
