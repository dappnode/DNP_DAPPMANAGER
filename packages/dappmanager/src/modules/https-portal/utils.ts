import { PackageContainer } from "../../types";
import { ComposeFileEditor } from "../compose/editor";

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

export function removeNetworkAliasCompose(
  container: PackageContainer,
  networkName: string
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);
  const composeService = compose.services()[container.serviceName];
  composeService.removeNetwork(networkName);
  compose.write();
}
