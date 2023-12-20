import { ComposeFileEditor } from "@dappnode/dockercompose";
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
  for (const core of [
    { dnpName: params.dappmanagerDnpName, ip: params.DAPPMANAGER_IP },
    { dnpName: params.bindDnpName, ip: params.BIND_IP },
  ]) {
    const compose = new ComposeFileEditor(core.dnpName, true);
    for (const service of Object.values(compose.services())) {
      logs.info(`editing service ${core.dnpName} ip to ${core.ip}`);
      service.editNetworkIp(params.DOCKER_PRIVATE_NETWORK_NAME, core.ip);
    }

    compose.write();
  }

  for (const core of [
    params.wifiDnpName,
    params.ipfsDnpName,
    params.vpnDnpName,
    params.HTTPS_PORTAL_DNPNAME,
    "wireguard.dnp.dappnode.eth",
  ]) {
    const compose = new ComposeFileEditor(core, true);
    compose.services();
    for (const service of Object.values(compose.services())) {
      logs.info(`removing ip from ${core}`);
      service.editNetworkIp(params.DOCKER_PRIVATE_NETWORK_NAME);
    }

    compose.write();
  }
}
