import {
  ComposeFileEditor,
  parseServiceNetworks,
} from "@dappnode/dockercompose";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";

export function ensureBindComposeIp(): void {
  const bindCompose = new ComposeFileEditor(params.bindDnpName, true);
  for (const service of Object.values(bindCompose.compose.services)) {
    if (service.networks) {
      const serviceCoreNetwork = parseServiceNetworks(service.networks);
      const coreNetwork =
        serviceCoreNetwork[params.DOCKER_PRIVATE_NETWORK_NAME];
      if (coreNetwork.ipv4_address !== params.BIND_IP) {
        logs.info(
          `editing service ${params.bindDnpName} ip from ${coreNetwork.ipv4_address} to ${params.BIND_IP}`
        );
        coreNetwork.ipv4_address = params.BIND_IP;
        bindCompose.write();
      }
    }
  }
}
