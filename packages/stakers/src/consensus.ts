import {
  ConsensusClientGnosis,
  ConsensusClientHolesky,
  ConsensusClientHoodi,
  ConsensusClientSepolia,
  ConsensusClientLukso,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  Network,
  StakerItem,
  UserSettings
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { getDefaultConsensusUserSettings } from "@dappnode/utils";

// TODO: move ethereumClient logic here

export class Consensus extends StakerComponent {
  readonly DbHandlers: Record<
    Network,
    {
      get: () => string | null | undefined;
      set: (globEnvValue: string | null | undefined) => Promise<void>;
    }
  > = {
    [Network.Mainnet]: db.consensusClientMainnet,
    [Network.Gnosis]: db.consensusClientGnosis,
    [Network.Prater]: db.consensusClientPrater,
    [Network.Holesky]: db.consensusClientHolesky,
    [Network.Sepolia]: db.consensusClientSepolia,
    [Network.Hoodi]: db.consensusClientHoodi,
    [Network.Lukso]: db.consensusClientLukso,
    [Network.StarknetMainnet]: { get: () => null, set: async () => {} },
    [Network.StarknetSepolia]: { get: () => null, set: async () => {} }
  };
  protected static readonly CompatibleConsensus: Record<Network, { dnpName: string; minVersion: string }[]> = {
    [Network.Mainnet]: [
      { dnpName: ConsensusClientMainnet.Prysm, minVersion: "3.0.4" },
      { dnpName: ConsensusClientMainnet.Lighthouse, minVersion: "1.0.3" },
      { dnpName: ConsensusClientMainnet.Teku, minVersion: "2.0.4" },
      { dnpName: ConsensusClientMainnet.Nimbus, minVersion: "1.0.5" },
      { dnpName: ConsensusClientMainnet.Lodestar, minVersion: "0.1.0" }
    ],
    [Network.Gnosis]: [
      { dnpName: ConsensusClientGnosis.Lighthouse, minVersion: "0.1.5" },
      { dnpName: ConsensusClientGnosis.Teku, minVersion: "0.1.5" },
      { dnpName: ConsensusClientGnosis.Lodestar, minVersion: "0.1.0" }
    ],
    [Network.Prater]: [
      { dnpName: ConsensusClientPrater.Prysm, minVersion: "1.0.15" },
      { dnpName: ConsensusClientPrater.Lighthouse, minVersion: "0.1.9" },
      { dnpName: ConsensusClientPrater.Teku, minVersion: "0.1.10" },
      { dnpName: ConsensusClientPrater.Nimbus, minVersion: "0.1.7" },
      { dnpName: ConsensusClientPrater.Lodestar, minVersion: "0.1.0" }
    ],
    [Network.Holesky]: [
      { dnpName: ConsensusClientHolesky.Lighthouse, minVersion: "0.1.2" },
      { dnpName: ConsensusClientHolesky.Prysm, minVersion: "0.1.3" },
      { dnpName: ConsensusClientHolesky.Teku, minVersion: "0.1.2" },
      { dnpName: ConsensusClientHolesky.Nimbus, minVersion: "0.1.2" },
      { dnpName: ConsensusClientHolesky.Lodestar, minVersion: "0.1.3" }
    ],
    [Network.Hoodi]: [
      { dnpName: ConsensusClientHoodi.Lighthouse, minVersion: "0.1.0" },
      { dnpName: ConsensusClientHoodi.Prysm, minVersion: "0.1.0" },
      { dnpName: ConsensusClientHoodi.Teku, minVersion: "0.1.0" },
      { dnpName: ConsensusClientHoodi.Nimbus, minVersion: "0.1.0" },
      { dnpName: ConsensusClientHoodi.Lodestar, minVersion: "0.1.0" }
    ],
    [Network.Sepolia]: [
      { dnpName: ConsensusClientSepolia.Prysm, minVersion: "0.1.2" },
      { dnpName: ConsensusClientSepolia.Lighthouse, minVersion: "0.1.0" }
    ],
    [Network.Lukso]: [
      { dnpName: ConsensusClientLukso.Prysm, minVersion: "0.1.0" },
      { dnpName: ConsensusClientLukso.Teku, minVersion: "0.1.0" }
    ],
    [Network.StarknetMainnet]: [],
    [Network.StarknetSepolia]: []
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllConsensus(network: Network): Promise<StakerItem[]> {
    return await super.getAll({
      dnpNames: Consensus.CompatibleConsensus[network].map((client) => client.dnpName),
      currentClient: this.DbHandlers[network].get()
    });
  }

  async persistSelectedConsensusIfInstalled(network: Network): Promise<void> {
    const currentConsensusDnpName = this.DbHandlers[network].get();
    if (currentConsensusDnpName) {
      const isInstalled = await this.isPackageInstalled(currentConsensusDnpName);

      if (!isInstalled) {
        // update status in db
        this.DbHandlers[network].set(undefined);
        return;
      }

      const userSettings = await this.getUserSettings(network, currentConsensusDnpName);

      await this.setStakerPkgConfig({ dnpName: currentConsensusDnpName, isInstalled, userSettings });

      await this.DbHandlers[network].set(currentConsensusDnpName);
    }
  }

  async setNewConsensus(network: Network, newConsensusDnpName: string | null) {
    const prevConsClientDnpName = this.DbHandlers[network].get();

    const userSettings = await this.getUserSettings(network, newConsensusDnpName);

    await super.setNew({
      newStakerDnpName: newConsensusDnpName,
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      fullnodeAliases: [`beacon-chain.${network}.dncore.dappnode`, `validator.${network}.dncore.dappnode`],
      compatibleClients: Consensus.CompatibleConsensus[network],
      userSettings,
      prevClient: prevConsClientDnpName
    });
    // persist on db
    if (newConsensusDnpName !== prevConsClientDnpName) await this.DbHandlers[network].set(newConsensusDnpName);
  }

  private async getUserSettings(network: Network, newConsensusDnpName: string | null): Promise<UserSettings> {
    if (!newConsensusDnpName) return {};

    const isPkgInstalled = await this.isPackageInstalled(newConsensusDnpName);
    let environment = isPkgInstalled ? {} : getDefaultConsensusUserSettings({ network }).environment;

    // Only for Mainnet and Hoodi, try to get backup beacon node
    if (network === Network.Mainnet || network === Network.Hoodi) {
      const backupUrl = await this.getBackupIfActive(network);
      if (backupUrl) {
        environment = {
          ...environment,
          validator: {
            ...(environment?.validator || {}),
            BACKUP_BEACON_NODES: backupUrl
          }
        };
      }
    }

    const userSettings = {
      environment,
      networks: this.getStakerNetworkSettings(network)
    };

    return userSettings;
  }

  /**
   * Returns backup beacon node URL if premium license is active and valid, otherwise null
   */
  private async getBackupIfActive(network: Network.Hoodi | Network.Mainnet): Promise<string | null> {
    try {
      const licenseRes = await fetch("http://premium.dappnode:8080/api/license");
      if (!licenseRes.ok) return null;
      const license = (await licenseRes.json()) as { hash?: string };
      const hash = typeof license.hash === "string" ? license.hash : null;
      if (!hash) return null;

      const keyRes = await fetch(`http://premium.dappnode:8080/api/keys/${hash}`);
      if (!keyRes.ok) return null;
      const keyData = (await keyRes.json()) as { ValidUntil?: string };
      if (!keyData.ValidUntil) return null;
      const validUntil = new Date(keyData.ValidUntil);
      if (isNaN(validUntil.getTime())) return null;
      if (validUntil.getTime() <= Date.now()) return null;

      if (network === Network.Mainnet) {
        return `https://${hash}:@mainnet.beacon.dappnode.io`;
      } else if (network === Network.Hoodi) {
        return `https://${hash}:@hoodi.beacon.dappnode.io`;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  private getStakerNetworkSettings(network: Network): UserSettings["networks"] {
    const validatorServiceName = "validator";
    const beaconServiceName = "beacon-chain";

    // helper to build each service’s networks
    const buildSvc = (svcName: string) => ({
      [params.DOCKER_STAKER_NETWORKS[network]]: {
        aliases: [`${svcName}.${network}.staker.dappnode`]
      },
      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
        aliases: [`${svcName}.${network}.dncore.dappnode`]
      },

      [params.DOCKER_PRIVATE_NETWORK_NEW_NAME]: {
        aliases: [`${svcName}.${network}.dappnode.private`]
      }
    });

    return {
      rootNetworks: this.getComposeRootNetworks(network),
      serviceNetworks: {
        [beaconServiceName]: buildSvc(beaconServiceName),
        [validatorServiceName]: buildSvc(validatorServiceName)
      }
    };
  }
}
