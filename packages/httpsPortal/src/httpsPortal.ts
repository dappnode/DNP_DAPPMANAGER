import {
  dockerCreateNetwork,
  dockerListNetworks,
  dockerNetworkConnect,
  dockerNetworkDisconnect,
  listPackageNoThrow,
} from "@dappnode/dockerapi";
import { listPackageContainers } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { getExternalNetworkAlias } from "./domains.js";
import {
  PackageContainer,
  HttpsPortalMapping,
  InstallPackageData,
  InstalledPackageData,
} from "@dappnode/types";
import { HttpsPortalApiClient } from "./apiClient.js";
import { ComposeEditor, ComposeFileEditor } from "@dappnode/dockercompose";
import { prettyDnpName } from "@dappnode/utils";
import { Log, logs } from "@dappnode/logger";
export { HttpsPortalApiClient };
export { getExposableServices } from "./exposable/index.js";

const externalNetworkName = params.DOCKER_EXTERNAL_NETWORK_NAME;

export class HttpsPortal {
  private httpsPortalApiClient: HttpsPortalApiClient;

  constructor(httpsPortalApiClient: HttpsPortalApiClient) {
    this.httpsPortalApiClient = httpsPortalApiClient;
  }

  /**
   * Expose an internal container to the external internet through the https-portal
   */
  async addMapping(mapping: HttpsPortalMapping): Promise<void> {
    if (!(await this.isRunningHttps())) return;
    const containers = await listPackageContainers();
    const container = await this.getContainerForMapping(mapping, containers);

    const externalNetworkAlias = getExternalNetworkAlias(container);
    const aliases = [externalNetworkAlias];

    // Ensure network exists
    const networks = await dockerListNetworks();
    if (!networks.find((network) => network.Name === externalNetworkName)) {
      await dockerCreateNetwork(externalNetworkName);
    }

    // Ensure the HTTPs portal container is connected to `externalNetworkName`
    const httpsPortalContainer = containers.find(
      (c) => c.dnpName === params.HTTPS_PORTAL_DNPNAME
    );
    if (!httpsPortalContainer) throw Error(`HTTPs portal container not found`);
    if (!this.isConnected(httpsPortalContainer)) {
      await dockerNetworkConnect(
        externalNetworkName,
        httpsPortalContainer.containerName
      );
    }

    // Container joins external network with a designated alias (immediate)
    // Check first is it's already connected, or dockerNetworkConnect throws
    if (!this.isConnected(container)) {
      await dockerNetworkConnect(externalNetworkName, container.containerName, {
        Aliases: aliases,
      });
    }

    // Call Http Portal API to add the mapping
    await this.httpsPortalApiClient.add({
      fromSubdomain: mapping.fromSubdomain,
      toHost: `${externalNetworkAlias}:${mapping.port}`,
      auth: mapping.auth,
    });

    // Edit compose to persist the setting
    this.addNetworkAliasCompose(container, externalNetworkName, aliases);

    // Check whether DNP_HTTPS compose has external network persisted
    const httpsComposePath = ComposeEditor.getComposePath(
      params.HTTPS_PORTAL_DNPNAME,
      true
    );
    const editor = new ComposeEditor(ComposeEditor.readFrom(httpsComposePath));

    if (editor.getComposeNetwork(externalNetworkName) === null) {
      const httpsExternalAlias = getExternalNetworkAlias(httpsPortalContainer);
      this.addNetworkAliasCompose(httpsPortalContainer, externalNetworkName, [
        httpsExternalAlias,
      ]);
    }
  }

  /**
   * Remove an internal container from being exposed to the external internet
   */
  async removeMapping(mapping: HttpsPortalMapping): Promise<void> {
    if (!(await this.isRunningHttps())) return;
    const containers = await listPackageContainers();
    const container = await this.getContainerForMapping(mapping, containers);

    const externalNetworkAlias = getExternalNetworkAlias(container);

    // Call Http Portal API to remove the mapping
    await this.httpsPortalApiClient.remove({
      fromSubdomain: mapping.fromSubdomain,
      toHost: externalNetworkAlias,
    });

    // If container still has mappings, don't disconnect from network
    const mappings = await this.getMappings(containers);
    const containerHasMappings = mappings.some(
      (mapping) =>
        mapping.dnpName === container.dnpName &&
        mapping.serviceName === container.serviceName
    );
    if (containerHasMappings) return;

    // Container leaves external network
    // Check first is it's connected, or dockerNetworkDisconnect throws
    if (this.isConnected(container)) {
      await dockerNetworkDisconnect(
        externalNetworkName,
        container.containerName
      );
    }

    // Edit compose to persist the setting
    this.removeNetworkAliasCompose(container, externalNetworkName);
  }

  async getMappings(
    containers?: PackageContainer[]
  ): Promise<HttpsPortalMapping[]> {
    if (!(await this.isRunningHttps())) return [];
    if (!containers) containers = await listPackageContainers();

    const entries = await this.httpsPortalApiClient.list();

    const aliases = new Map<string, PackageContainer>();
    for (const container of containers) {
      const externalNetworkAlias = getExternalNetworkAlias(container);
      aliases.set(externalNetworkAlias, container);
    }

    const mappings: HttpsPortalMapping[] = [];
    for (const { fromSubdomain, toHost, auth } of entries) {
      const [alias, port] = toHost.split(":");
      const container = aliases.get(alias);
      if (container) {
        mappings.push({
          fromSubdomain,
          dnpName: container.dnpName,
          serviceName: container.serviceName,
          port: parseInt(port) || 80,
          auth,
        });
      }
    }
    return mappings;
  }

  /**
   * Returns true if the container has assigned a mapping to the https-portal
   */
  async hasMapping(dnpName: string, serviceName: string): Promise<boolean> {
    if (!(await this.isRunningHttps())) return false;
    const entries = await this.httpsPortalApiClient.list();
    const mappingAlias = getExternalNetworkAlias({ serviceName, dnpName });
    for (const { toHost } of entries) {
      // toHost format: someDomain:80
      const alias = toHost.split(":")[0];
      if (alias === mappingAlias) return true;
    }
    return false;
  }

  /**
   * Connect to dnpublic_network with an alias if:
   * - is HTTPS package
   * - any package with https portal mappings
   */
  async connectToPublicNetwork(
    pkg: InstallPackageData,
    externalNetworkName: string
  ): Promise<void> {
    // if there is no https, checks aren't needed
    if (!(await this.isRunningHttps())) return;

    // create network if necessary
    const networks = await dockerListNetworks();
    if (!networks.find((network) => network.Name === externalNetworkName))
      await dockerCreateNetwork(externalNetworkName);

    const containers =
      (
        await listPackageNoThrow({
          dnpName: pkg.dnpName,
        })
      )?.containers || [];

    if (containers.length === 0) return;

    for (const container of containers) {
      if (
        pkg.dnpName === params.HTTPS_PORTAL_DNPNAME ||
        (await this.hasMapping(pkg.dnpName, container.serviceName))
      ) {
        const alias = getExternalNetworkAlias({
          serviceName: container.serviceName,
          dnpName: pkg.dnpName,
        });

        if (!container.networks.find((n) => n.name === externalNetworkName)) {
          await dockerNetworkConnect(
            externalNetworkName,
            container.containerName,
            { Aliases: [alias] }
          );
        }
      }
    }
  }

  /**
   * Expose default HTTPS ports on installation defined in the manifest - exposable
   */
  async exposeByDefaultHttpsPorts(
    pkg: InstallPackageData,
    log: Log
  ): Promise<void> {
    const exposables = pkg.manifest.exposable;

    // Return if no exposable or not exposeByDefault
    if (!exposables || !exposables.some((exp) => exp.exposeByDefault)) return;

    // Requires that https package exists and it is running
    if (!(await this.isRunningHttps()))
      throw Error(
        `HTTPS package not running but required to expose HTTPS ports by default.`
      );

    const currentMappings = await this.getMappings();
    const portMappinRollback: HttpsPortalMapping[] = [];

    for (const exposable of exposables) {
      if (exposable.exposeByDefault) {
        const portalMapping: HttpsPortalMapping = {
          fromSubdomain: exposable.fromSubdomain || prettyDnpName(pkg.dnpName), // get dnpName by default
          dnpName: pkg.dnpName,
          serviceName:
            exposable.serviceName || Object.keys(pkg.compose.services)[0], // get first service name by default (docs: https://docs.dappnode.io/es/developers/manifest-reference/#servicename)
          port: exposable.port,
        };

        if (
          currentMappings.length > 0 &&
          currentMappings.includes(portalMapping)
        )
          continue;

        try {
          // Expose default HTTPS ports
          log(
            pkg.dnpName,
            `Exposing ${prettyDnpName(pkg.dnpName)}:${
              exposable.port
            } to the external internet`
          );
          await this.addMapping(portalMapping);
          portMappinRollback.push(portalMapping);

          log(
            pkg.dnpName,
            `Exposed ${prettyDnpName(pkg.dnpName)}:${
              exposable.port
            } to the external internet`
          );
        } catch (e) {
          if (e.message.includes("External endpoint already exists")) {
            // Bypass error if already exposed: 400 Bad Request {"error":"External endpoint already exists"}
            log(
              pkg.dnpName,
              `External endpoint already exists for ${prettyDnpName(
                pkg.dnpName
              )}:${exposable.port}`
            );
          } else {
            // Remove all mappings and throw error to trigger package install rollback
            e.message = `${e.message} Error exposing default HTTPS ports, removing mappings`;
            for (const mappingRollback of portMappinRollback) {
              await this.removeMapping(mappingRollback).catch((e) => {
                log(
                  pkg.dnpName,
                  `Error removing mapping ${JSON.stringify(mappingRollback)}, ${
                    e.message
                  }`
                );
              });
            }
            throw e;
          }
        }
      }
    }
  }

  async removeMappings(pkg: InstalledPackageData): Promise<void> {
    if (!(await this.isRunningHttps())) return;
    const mappings = await this.getMappings(pkg.containers);
    for (const mapping of mappings) {
      if (mapping.dnpName === pkg.dnpName)
        await this.removeMapping(mapping)
          // Bypass error to continue deleting mappings
          .catch((e) =>
            logs.error(`Error removing https mapping of ${pkg.dnpName}`, e)
          );
    }
  }

  private async getContainerForMapping(
    mapping: HttpsPortalMapping,
    containers?: PackageContainer[]
  ): Promise<PackageContainer> {
    if (!containers) containers = await listPackageContainers();

    const container = containers.find(
      (c) =>
        c.dnpName === mapping.dnpName && c.serviceName === mapping.serviceName
    );
    if (!container)
      throw Error(
        `No container found for ${mapping.dnpName} ${mapping.serviceName}`
      );

    return container;
  }

  private isConnected(container: PackageContainer): boolean {
    return container.networks.some((n) => n.name === externalNetworkName);
  }

  /**
   * Returns true if HTTPS package installed and running, otherwise return false
   */
  private async isRunningHttps(): Promise<boolean> {
    const httpsPackage = await listPackageNoThrow({
      dnpName: params.HTTPS_PORTAL_DNPNAME,
    });

    if (!httpsPackage) return false;

    // Check every HTTPS container is running
    return httpsPackage.containers.every((container) => container.running);
  }

  private removeNetworkAliasCompose(
    container: PackageContainer,
    networkName: string
  ): void {
    const compose = new ComposeFileEditor(container.dnpName, container.isCore);
    const composeService = compose.services()[container.serviceName];
    composeService.removeNetwork(networkName);
    compose.write();
  }

  private addNetworkAliasCompose(
    container: PackageContainer,
    networkName: string,
    aliases: string[]
  ): void {
    const compose = new ComposeFileEditor(container.dnpName, container.isCore);
    const composeService = compose.services()[container.serviceName];
    composeService.addNetwork(networkName, { aliases });
    compose.write();
  }
}
