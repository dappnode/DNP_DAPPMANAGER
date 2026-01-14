import {
  ConsensusClientGnosis,
  ConsensusClientHolesky,
  ConsensusClientHoodi,
  ConsensusClientSepolia,
  ConsensusClientLukso,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  StarknetConsensusMainnet,
  StarknetConsensusSepolia,
  Network,
  StakerItem,
  UserSettings
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { getDefaultConsensusUserSettings } from "@dappnode/utils";
import { logs } from "@dappnode/logger";

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
    [Network.StarknetMainnet]: db.consensusStarknetMainnet,
    [Network.StarknetSepolia]: db.consensusStarknetSepolia
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
    [Network.StarknetMainnet]: [{ dnpName: StarknetConsensusMainnet.StarknetStaking, minVersion: "0.1.0" }],
    [Network.StarknetSepolia]: [{ dnpName: StarknetConsensusSepolia.StarknetStaking, minVersion: "0.1.0" }]
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllConsensus(network: Network): Promise<StakerItem[]> {
    // For Starknet networks, include staking-specific envs
    if (network === Network.StarknetMainnet || network === Network.StarknetSepolia) {
      const starknetstakingDnpName = Consensus.CompatibleConsensus[network]?.[0]?.dnpName;
      return await super.getAll({
        dnpNames: Consensus.CompatibleConsensus[network].map((client) => client.dnpName),
        currentClient: this.DbHandlers[network].get(),
        starknetSignerOperationalAddress: await this.getStarknetOperationalAddresses(starknetstakingDnpName),
        starknetSignerPrivateKey: await this.getStarknetSignerPrivateKey(starknetstakingDnpName)
      });
    }
    return await super.getAll({
      dnpNames: Consensus.CompatibleConsensus[network].map((client) => client.dnpName),
      currentClient: this.DbHandlers[network].get()
    });
  }

  // Done in the same way as mevBoost relays, useful to print current starknet signer envs in UI
  async getStarknetOperationalAddresses(starknetDnpName?: string): Promise<string> {
    let address = "";
    if (!starknetDnpName || !(await listPackageNoThrow({ dnpName: starknetDnpName }))) return address;
    const pkgEnv = new ComposeFileEditor(starknetDnpName, false).getUserSettings().environment;
    if (pkgEnv) {
      address = pkgEnv["staking"]["SIGNER_OPERATIONAL_ADDRESS"];
    }
    return address;
  }

  // Done in the same way as mevBoost relays, useful to print current starknet signer envs in UI
  async getStarknetSignerPrivateKey(starknetDnpName?: string): Promise<string> {
    let key = "";
    if (!starknetDnpName || !(await listPackageNoThrow({ dnpName: starknetDnpName }))) return key;
    const pkgEnv = new ComposeFileEditor(starknetDnpName, false).getUserSettings().environment;
    if (pkgEnv) {
      key = pkgEnv["staking"]["SIGNER_PRIVATE_KEY"];
    }
    return key;
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

  async setNewConsensus(
    network: Network,
    newConsensusDnpName: string | null,
    starknetEnvs?: {
      starknetSignerOperationalAddress?: string;
      starknetSignerPrivateKey?: string;
    }
  ) {
    const prevConsClientDnpName = this.DbHandlers[network].get();

    const userSettings = await this.getUserSettings(network, newConsensusDnpName, starknetEnvs);

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

    // Clear backup beacon nodes from the previous client if switching clients
    await this.clearBackupBeaconNodesFromPrevClient(network, prevConsClientDnpName, newConsensusDnpName);
  }

  /**
   * If changing consensus clients and in a network where premium backup exists,
   * clears BACKUP_BEACON_NODES from the previous client.
   * This is done after everything else and only logs errors as this is not critical.
   */
  private async clearBackupBeaconNodesFromPrevClient(
    network: Network,
    prevConsClientDnpName: string | null | undefined,
    newConsensusDnpName: string | null
  ): Promise<void> {
    if (
      !prevConsClientDnpName ||
      prevConsClientDnpName === newConsensusDnpName ||
      (network !== Network.Mainnet && network !== Network.Gnosis && network !== Network.Hoodi)
    ) {
      return;
    }

    try {
      const isPrevInstalled = await this.isPackageInstalled(prevConsClientDnpName);
      if (isPrevInstalled) {
        const composeEditor = new ComposeFileEditor(prevConsClientDnpName, false);
        const validatorService = composeEditor.services()["validator"]; // WARNING: assumes service is named "validator"
        if (validatorService) {
          validatorService.mergeEnvs({ BACKUP_BEACON_NODES: "" });
          composeEditor.write();
          logs.info(`Cleared BACKUP_BEACON_NODES from previous client ${prevConsClientDnpName}`);
        }
      }
    } catch (e) {
      logs.error(`Failed to clear BACKUP_BEACON_NODES on previous client ${prevConsClientDnpName}`, e);
    }
  }

  private async getUserSettings(
    network: Network,
    newConsensusDnpName: string | null,
    starknetEnvs?: {
      starknetSignerOperationalAddress?: string;
      starknetSignerPrivateKey?: string;
    }
  ): Promise<UserSettings> {
    if (!newConsensusDnpName) return {};

    const isPkgInstalled = await this.isPackageInstalled(newConsensusDnpName);
    let environment = isPkgInstalled ? {} : getDefaultConsensusUserSettings({ network }).environment;

    // Only for Mainnet, Gnosis and Hoodi, try to get backup beacon node
    if (network === Network.Mainnet || network === Network.Gnosis || network === Network.Hoodi) {
      const backupUrl = await this.getBackupIfActiveNoThrow(network);
      if (backupUrl) {
        logs.info(`BACKUP ACTIVE, Setting BACKUP_BEACON_NODES for ${newConsensusDnpName} to ${backupUrl}`);
        environment = {
          ...environment,
          validator: {
            ...(environment?.validator || {}),
            BACKUP_BEACON_NODES: backupUrl
          }
        };
      }
    }

    // For Starknet networks, apply staking-specific environment variables
    if (
      (network === Network.StarknetMainnet || network === Network.StarknetSepolia) &&
      starknetEnvs?.starknetSignerOperationalAddress &&
      starknetEnvs?.starknetSignerPrivateKey
    ) {
      const starknetStakingServiceName = "staking";
      environment = {
        ...environment,
        [starknetStakingServiceName]: {
          ...(environment?.[starknetStakingServiceName] || {}),
          SIGNER_OPERATIONAL_ADDRESS: starknetEnvs.starknetSignerOperationalAddress,
          SIGNER_PRIVATE_KEY: starknetEnvs.starknetSignerPrivateKey
        }
      };
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
  private async getBackupIfActiveNoThrow(network: Network.Hoodi | Network.Mainnet | Network.Gnosis): Promise<string | null> {
    try {
      const licenseRes = await fetch("http://premium.dappnode:8080/api/license");
      if (!licenseRes.ok) return null;
      const license = (await licenseRes.json()) as { hash?: string };
      const hash = typeof license.hash === "string" ? license.hash : null;
      if (!hash) return null;

      const detailsUrl = `http://premium.dappnode:8080/api/keys/details?id=${encodeURIComponent(hash)}`;
      const detailsRes = await fetch(detailsUrl);

      if (!detailsRes.ok) return null;

      const details = (await detailsRes.json()) as {
        id?: string;
        networks?: Record<
          string,
          {
            activation_history?: Array<{ activation_date: string; end_date: string }>;
            available_activation_seconds?: number;
            time_to_be_available?: number;
            active?: boolean;
            validator_limit?: number;
          }
        >;
      };
      if (!details.networks) return null;

      const netStatus = details.networks[network];
      if (!netStatus) return null;

      const isActive = netStatus.active === true;
      if (!isActive) return null;

      const url = `https://${hash}:@${network}.beacon.dappnode.io`;

      return url;
    } catch (e) {
      logs.error(`Error while getting backup status in ${network}`, e);
      return null;
    }
  }

  private getStakerNetworkSettings(network: Network): UserSettings["networks"] {
    // helper to build each service's networks
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

    // For Starknet networks, use "staking" as the service name
    if (network === Network.StarknetMainnet || network === Network.StarknetSepolia) {
      const stakingServiceName = "staking";
      return {
        rootNetworks: this.getComposeRootNetworks(network),
        serviceNetworks: {
          [stakingServiceName]: buildSvc(stakingServiceName)
        }
      };
    }

    const validatorServiceName = "validator";
    const beaconServiceName = "beacon-chain";

    return {
      rootNetworks: this.getComposeRootNetworks(network),
      serviceNetworks: {
        [beaconServiceName]: buildSvc(beaconServiceName),
        [validatorServiceName]: buildSvc(validatorServiceName)
      }
    };
  }
}
