import { PackageContainer } from "@dappnode/types";
import { ComposeFileEditor } from "@dappnode/dockercompose";

export function addNetworkAliasCompose(
  container: PackageContainer,
  networkName: string,
  aliases: string[]
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);
  const composeService = compose.services()[container.serviceName];
  composeService.addNetwork(networkName, { aliases });
  compose.write();
}
