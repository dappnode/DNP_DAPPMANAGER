import {
  MevBoostHolesky,
  MevBoostHoodi,
  MevBoostMainnet,
  MevBoostPrater,
  Network,
  StakerItem,
  UserSettings
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { listPackageNoThrow, listPackages } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { ComposeFileEditor } from "@dappnode/dockercompose";

export class MevBoost extends StakerComponent {
  readonly DbHandlers: Record<Network, { get: () => boolean; set: (globEnvValue: boolean) => Promise<void> }> = {
    [Network.Mainnet]: db.mevBoostMainnet,
    [Network.Gnosis]: db.mevBoostGnosis,
    [Network.Prater]: db.mevBoostPrater,
    [Network.Holesky]: db.mevBoostHolesky,
    [Network.Sepolia]: db.mevBoostSepolia,
    [Network.Hoodi]: db.mevBoostHoodi,
    [Network.Lukso]: db.mevBoostLukso
  };

  protected static readonly CompatibleMevBoost: Record<Network, { dnpName: string; minVersion: string } | null> = {
    [Network.Mainnet]: {
      dnpName: MevBoostMainnet.Mevboost,
      minVersion: "0.1.0"
    },
    [Network.Gnosis]: null,
    [Network.Prater]: {
      dnpName: MevBoostPrater.Mevboost,
      minVersion: "0.1.0"
    },
    [Network.Holesky]: {
      dnpName: MevBoostHolesky.Mevboost,
      minVersion: "0.1.0"
    },
    [Network.Hoodi]: {
      dnpName: MevBoostHoodi.Mevboost,
      minVersion: "0.1.0"
    },
    [Network.Lukso]: null,
    [Network.Sepolia]: null
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllMevBoost(network: Network): Promise<StakerItem[]> {
    const mevBoostDnpName = MevBoost.CompatibleMevBoost[network]?.dnpName;
    return await Promise.all(
      (mevBoostDnpName ? [mevBoostDnpName] : []).map(async (dnpName) =>
        super.getStakerPkg({
          dnpName,
          dnpList: await listPackages(),
          userSettings: this.getUserSettings(network, null),
          currentClient: this.DbHandlers[network].get(),
          relays: await this.getMevBoostCurrentRelays(dnpName)
        })
      )
    );
  }

  async getMevBoostCurrentRelays(mevBoostDnpName?: string): Promise<string[]> {
    const relays: string[] = [];
    if (!mevBoostDnpName || !(await listPackageNoThrow({ dnpName: mevBoostDnpName }))) return relays;
    const pkgEnv = new ComposeFileEditor(mevBoostDnpName, false).getUserSettings().environment;
    if (pkgEnv) {
      pkgEnv["mev-boost"]["RELAYS"].split(",").forEach((relay) => relays.push(relay));
    }
    return relays;
  }

  async persistMevBoostIfInstalledAndRunning(network: Network): Promise<void> {
    const mevBoostDnpName = MevBoost.CompatibleMevBoost[network]?.dnpName;

    if (mevBoostDnpName) {
      const mevBoostDnp = await listPackageNoThrow({ dnpName: mevBoostDnpName });
      const isRunning = mevBoostDnp?.containers.some((container) => container.running);

      if (!isRunning) {
        this.DbHandlers[network].set(false);
        return;
      }

      const userSettings = this.getUserSettings(network, null);

      await this.setStakerPkgConfig({
        dnpName: mevBoostDnpName,
        isInstalled: true,
        userSettings
      });

      await this.DbHandlers[network].set(true);
    }
  }

  async setNewMevBoost(network: Network, newMevBoostDnpName: string | null, newRelays: string[]) {
    const compatibleMevBoost = MevBoost.CompatibleMevBoost[network];
    await super.setNew({
      newStakerDnpName: newMevBoostDnpName,
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      fullnodeAliases: [`mev-boost.${network}.dncore.dappnode`],
      compatibleClients: compatibleMevBoost ? [compatibleMevBoost] : null,
      userSettings: newMevBoostDnpName ? this.getUserSettings(network, newRelays) : {},
      prevClient: compatibleMevBoost ? compatibleMevBoost.dnpName : null
    });
    // persist on db
    if (Boolean(newMevBoostDnpName) !== this.DbHandlers[network].get())
      await this.DbHandlers[network].set(newMevBoostDnpName ? true : false);
  }

  private getUserSettings(network: Network, newRelays: string[] | null): UserSettings {
    const mevBoostServiceName = "mev-boost";

    const userSettings: UserSettings = {
      // If the package is not installed, we use the default environment
      environment: newRelays
        ? {
            [mevBoostServiceName]: {
              ["RELAYS"]:
                newRelays
                  .join(",")
                  .trim()
                  .replace(/(^,)|(,$)/g, "") || ""
            }
          }
        : {},
      networks: this.getStakerNetworkSettings(network)
    };

    return userSettings;
  }

  private getStakerNetworkSettings(network: Network): UserSettings["networks"] {
    const mevBoostServiceName = "mev-boost";

    return {
      rootNetworks: this.getComposeRootNetworks(network),
      serviceNetworks: {
        [mevBoostServiceName]: {
          [params.DOCKER_STAKER_NETWORKS[network]]: {
            aliases: [`${mevBoostServiceName}.${network}.staker.dappnode`]
          },
          [params.DOCKER_PRIVATE_NETWORK_NAME]: {
            aliases: [`${mevBoostServiceName}.${network}.dncore.dappnode`]
          },
          [params.DOCKER_PRIVATE_NETWORK_NEW_NAME]: {
            aliases: [`${mevBoostServiceName}.${network}.dappnode.private`]
          }
        }
      }
    };
  }
}
