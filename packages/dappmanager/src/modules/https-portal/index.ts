import { dockerNetworkConnect, dockerNetworkDisconnect } from "../docker";
import { listContainers } from "../docker/list";
import { ComposeFileEditor } from "../compose/editor";
import params from "../../params";
import { getExternalNetworkAlias } from "../../domains";
import { PackageContainer, HttpsPortalMapping } from "../../types";
import { HttpsPortalApiClient } from "./apiClient";
export { HttpsPortalApiClient };

const externalNetworkName = params.DNP_EXTERNAL_NETWORK_NAME;

export class HttpsPortal {
  private httpsPortalApiClient: HttpsPortalApiClient;

  constructor(httpsPortalApiClient: HttpsPortalApiClient) {
    this.httpsPortalApiClient = httpsPortalApiClient;
  }

  /**
   * Expose an internal container to the external internet through the https-portal
   */
  async addMapping(mapping: HttpsPortalMapping): Promise<void> {
    const container = await this.getContainerForMapping(mapping);

    const externalNetworkAlias = getExternalNetworkAlias(container);
    const aliases = [externalNetworkAlias];

    // Call Http Portal API to add the mapping
    await this.httpsPortalApiClient.add({
      fromSubdomain: mapping.fromSubdomain,
      toHost: externalNetworkAlias
    });

    // Container joins external network with a designated alias (immeditate)
    await dockerNetworkConnect(
      externalNetworkName,
      container.containerName,
      aliases
    );

    // Edit compose to persist the setting
    const compose = new ComposeFileEditor(container.dnpName, container.isCore);
    const composeService = compose.services()[container.serviceName];
    composeService.addNetwork(externalNetworkName, { aliases });
    compose.write();
  }

  /**
   * Remove an internal container from being exposed to the external internet
   */
  async removeMapping(mapping: HttpsPortalMapping): Promise<void> {
    const container = await this.getContainerForMapping(mapping);

    const externalNetworkAlias = getExternalNetworkAlias(container);

    // Call Http Portal API to remove the mapping
    await this.httpsPortalApiClient.remove({
      fromSubdomain: mapping.fromSubdomain,
      toHost: externalNetworkAlias
    });

    if (await this.containerHasMappings(container)) {
      // Container still has mappings, skip
      return;
    }

    // Container leaves external network
    await dockerNetworkDisconnect(externalNetworkName, container.containerName);

    // Edit compose to persist the setting
    const compose = new ComposeFileEditor(container.dnpName, container.isCore);
    const composeService = compose.services()[container.serviceName];
    composeService.removeNetwork(externalNetworkName);
    compose.write();
  }

  async getMappings(): Promise<HttpsPortalMapping[]> {
    const entries = await this.httpsPortalApiClient.list();

    const containers = await listContainers();

    const aliases = new Map<string, PackageContainer>();
    for (const container of containers) {
      const externalNetworkAlias = getExternalNetworkAlias(container);
      aliases.set(externalNetworkAlias, container);
    }

    const mappings: HttpsPortalMapping[] = [];
    for (const { fromSubdomain, toHost } of entries) {
      const [alias, port] = toHost.split(":");
      const container = aliases.get(alias);
      if (container) {
        mappings.push({
          fromSubdomain,
          dnpName: container.dnpName,
          serviceName: container.serviceName,
          port: parseInt(port) || 80
        });
      }
    }
    return mappings;
  }

  private async containerHasMappings(
    container: PackageContainer
  ): Promise<boolean> {
    const mappings = await this.getMappings();
    return mappings.some(
      mapping =>
        mapping.dnpName === container.dnpName &&
        mapping.serviceName === container.serviceName
    );
  }

  private async getContainerForMapping(
    mapping: HttpsPortalMapping
  ): Promise<PackageContainer> {
    const containers = await listContainers();
    const container = containers.find(
      c =>
        c.dnpName === mapping.dnpName && c.serviceName === mapping.serviceName
    );
    if (!container)
      throw Error(
        `No container found for ${mapping.dnpName} ${mapping.serviceName}`
      );

    return container;
  }
}
