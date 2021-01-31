import { dockerNetworkConnect, dockerNetworkDisconnect } from "../docker";
import { ComposeFileEditor } from "../compose/editor";
import params from "../../params";
import { getExternalNetworkAlias, getPublicSubdomain } from "../../domains";
import { PackageContainer } from "../../types";
import { HttpsPortalApiClient } from "./apiClient";

const externalNetworkName = params.DNP_EXTERNAL_NETWORK_NAME;

export class HttpsPortal {
  httpsPortalApiClient: HttpsPortalApiClient;

  constructor(httpsPortalApiClient: HttpsPortalApiClient) {
    this.httpsPortalApiClient = httpsPortalApiClient;
  }

  /**
   * Expose an internal container to the external internet through the https-portal
   */
  async expose(container: PackageContainer): Promise<void> {
    const externalNetworkAlias = getExternalNetworkAlias(container);
    const aliases = [externalNetworkAlias];

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

    // Call Http Portal API to add the mapping
    await this.httpsPortalApiClient.add({
      fromPublicSubdomain: getPublicSubdomain(container),
      toInternalDomain: externalNetworkAlias
    });
  }

  /**
   * Remove an internal container from being exposed to the external internet
   */
  async unExpose(container: PackageContainer): Promise<void> {
    // Container leaves external network
    await dockerNetworkDisconnect(externalNetworkName, container.containerName);

    // Edit compose to persist the setting
    const compose = new ComposeFileEditor(container.dnpName, container.isCore);
    const composeService = compose.services()[container.serviceName];
    composeService.removeNetwork(externalNetworkName);
    compose.write();

    // Call Http Portal API to remove the mapping
    await this.httpsPortalApiClient.add({
      fromPublicSubdomain: getPublicSubdomain(container),
      toInternalDomain: getExternalNetworkAlias(container)
    });
  }
}
