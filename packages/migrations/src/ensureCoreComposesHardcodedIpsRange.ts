import { listPackages } from "@dappnode/dockerapi";
import {
  ComposeFileEditor,
  parseServiceNetworks,
} from "@dappnode/dockercompose";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";

/**
 * Ensure compose hardcoded IPs are in valid IP range
 * depending on the subnet for:
 * - bind
 * - dappmanager
 *
 * It should completely remove for other core containers:
 * - ipfs
 * - wifi
 * - wireguard
 * - https
 * - openvpn
 *
 * This prevents from unexpected starts of core contaiers from docker-compose.yml files
 */
export async function ensureCoreComposesHardcodedIpsRange(): Promise<void> {
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

  const pkgsToRemoveHardcodedIps = [
    params.dappmanagerDnpName,
    params.wifiDnpName,
    params.ipfsDnpName,
  ];
  const pkgs = await listPackages();
  // Optional pkgs
  if (pkgs.find((pkg) => pkg.dnpName === params.HTTPS_PORTAL_DNPNAME))
    pkgsToRemoveHardcodedIps.push(params.HTTPS_PORTAL_DNPNAME);
  if (pkgs.find((pkg) => pkg.dnpName === params.WIREGUARD_DNP_NAME))
    pkgsToRemoveHardcodedIps.push(params.WIREGUARD_DNP_NAME);
  if (pkgs.find((pkg) => pkg.dnpName === params.vpnDnpName))
    pkgsToRemoveHardcodedIps.push(params.vpnDnpName);

  for (const core of pkgsToRemoveHardcodedIps) {
    const compose = new ComposeFileEditor(core, true);
    for (const service of Object.values(compose.compose.services)) {
      if (service.networks) {
        const serviceCoreNetwork = parseServiceNetworks(service.networks);
        const coreNetwork =
          serviceCoreNetwork[params.DOCKER_PRIVATE_NETWORK_NAME];
        if (coreNetwork.ipv4_address) {
          logs.info(`removing ip ${coreNetwork.ipv4_address} from ${core}`);
          coreNetwork.ipv4_address = undefined;
          compose.write();
        }
      }
    }
  }
}
