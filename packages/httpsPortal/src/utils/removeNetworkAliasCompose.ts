import { PackageContainer } from "@dappnode/types";
import { ComposeFileEditor } from "@dappnode/dockercompose";

export function removeNetworkAliasCompose(
  container: PackageContainer,
  networkName: string
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);
  const composeService = compose.services()[container.serviceName];
  composeService.removeNetwork(networkName);
  compose.write();
}
