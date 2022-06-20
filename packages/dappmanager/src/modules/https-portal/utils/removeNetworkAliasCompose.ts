import { PackageContainer } from "../../../types";
import { ComposeFileEditor } from "../../compose/editor";

export function removeNetworkAliasCompose(
  container: PackageContainer,
  networkName: string
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);
  const composeService = compose.services()[container.serviceName];
  composeService.removeNetwork(networkName);
  compose.write();
}
