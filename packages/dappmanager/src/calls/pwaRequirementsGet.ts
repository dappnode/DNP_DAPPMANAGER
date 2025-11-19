import { httpsPortal } from "@dappnode/httpsportal";
import { domain } from "@dappnode/db";
import { docker, listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
// import { wrapHandler } from "../api/utils.js";
import dns from "dns/promises";
import net from "net";
import { NetworkInspectInfo } from "dockerode";
import { logs } from "@dappnode/logger";

/**
 * Returns the HTTPS package status and PWA mapping url if it exists, otherwise adds the mapping.
 */
export async function pwaRequirementsGet({ host }: { host: string }): Promise<{
  httpsDnpInstalled: boolean;
  isHttpsRunning: boolean;
  pwaMappingUrl: string | undefined;
  privateIp?: boolean | undefined; //  weather the IP assigned by the VPN is private or not so it can bypass HTTPS package ngnix rules
  pwaDnsResolves?: boolean | undefined; // weather the DNS resolves to the https container in dnprivate_network IP or not
  containersInExternalNetwork?: { dappmanager: boolean; httpsDnp: boolean } | undefined; // weather the containers are in the external network or not
  externalPointToDappmanager: boolean; //dappmanager.external resolves to dappmanager container IP in dnpublic_network
}> {
  const httpsDnp = await listPackageNoThrow({ dnpName: params.HTTPS_PORTAL_DNPNAME });
  const httpsDnpInstalled = Boolean(httpsDnp);

  const isHttpsRunning = httpsDnp && httpsDnp.containers.every((c) => c.state === "running");

  await httpsPortal.addPwaMappingIfNotExists();
  const pwaMappingUrl = await pwaUrlGet();

  const privateIp = host === "my.dappnode.private" ? await isPrivateIp(host) : undefined;

  const pwaDnsResolves = pwaMappingUrl ? await isPwaResolvable(pwaMappingUrl) : undefined;

  const containersInExternalNetwork = await checkContainersOnPublicNetwork();

  const externalPointToDappmanager = await doesExternalPointToDappmanager();

  return {
    pwaMappingUrl: "https://" + pwaMappingUrl,
    httpsDnpInstalled,
    isHttpsRunning: Boolean(isHttpsRunning),
    privateIp,
    pwaDnsResolves,
    containersInExternalNetwork,
    externalPointToDappmanager
  };
}

/**
 * Returns the PWA mapping URL if it exists, otherwise returns undefined.
 */
export async function pwaUrlGet(): Promise<string | undefined> {
  const mappings = await httpsPortal.getMappings();
  const pwaMapping = mappings.find((mapping) => mapping.fromSubdomain === "pwa");
  const dyndnsDomain = domain.get();

  return pwaMapping ? `pwa.${dyndnsDomain}` : undefined;
}

async function isPwaResolvable(pwaMappingUrl: string): Promise<boolean | undefined> {
  const resolver = new dns.Resolver();
  resolver.setServers([params.BIND_NEW_IP]);

  try {
    const result = await resolver.resolve4(pwaMappingUrl);

    if (result.length > 0) {
      return true;
    }
    logs.error("PWA Check - Pwa not Resolvable");
    return false;
  } catch (err) {
    logs.error("PWA Check - DNS resolution failed:", err);
    return undefined;
  }
}

export async function checkContainersOnPublicNetwork(): Promise<{ dappmanager: boolean; httpsDnp: boolean }> {
  const publicNetwork = params.DOCKER_EXTERNAL_NETWORK_NAME;

  const networks = await docker.listNetworks({ filters: { name: [publicNetwork] } });
  if (!networks.length) {
    throw new Error(`Network "${publicNetwork}" not found`);
  }

  const net = docker.getNetwork(networks[0].Id);
  const info = (await net.inspect()) as NetworkInspectInfo;

  const containersMap = info.Containers ?? {};
  const connectedNames = Object.values(containersMap).map((c) => c.Name);
  const connectedSet = new Set(connectedNames);

  const dappmanagerConnected = connectedSet.has(params.dappmanagerContainerName);
  const httpsConnected = connectedSet.has(params.httpsContainerName);

  if (!dappmanagerConnected) logs.error(`PWA Check - dappmanager not in "${publicNetwork}"`);
  if (!httpsConnected) logs.error(`PWA Check - https not in "${publicNetwork}"`);

  return { dappmanager: dappmanagerConnected, httpsDnp: httpsConnected };
}

export async function isPrivateIp(domain: string): Promise<boolean> {
  try {
    const { address } = await dns.lookup(domain);
    // This implementation targets IPv4 subnets (e.g. 10.20.0.0/16)
    if (!net.isIPv4(address)) return false;

    const privateNetworkSubnet = params.DOCKER_NETWORK_NEW_SUBNET;
    const ipInt = ipv4ToInt(address);
    const { baseInt, maskInt } = parseSubnet(privateNetworkSubnet);
    if (baseInt === null || maskInt === null) return false;

    return (ipInt & maskInt) === (baseInt & maskInt);
  } catch (err) {
    logs.error(`PWA Check - Error while checking ${domain} private IP`, err);
    return false;
  }
}

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function parseSubnet(subnet: string): { baseInt: number | null; maskInt: number | null } {
  const [base, suffix] = subnet.split("/");
  if (!base || !suffix || !net.isIPv4(base)) return { baseInt: null, maskInt: null };

  const baseInt = ipv4ToInt(base);

  // CIDR prefix length (e.g., /16)
  if (/^\d{1,2}$/.test(suffix)) {
    const prefix = Number(suffix);
    if (prefix < 0 || prefix > 32) return { baseInt: null, maskInt: null };
    const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return { baseInt, maskInt };
  }

  // Dotted netmask (e.g., /255.255.0.0)
  if (net.isIPv4(suffix)) {
    const maskInt = ipv4ToInt(suffix);
    return { baseInt, maskInt };
  }

  return { baseInt: null, maskInt: null };
}

async function doesExternalPointToDappmanager(): Promise<boolean> {
  let resolvedIp: string | null = null;
  let dappmanagerIp: string | null = null;

  try {
    // DNS resolve dappmanager.external
    const lookup = await dns.lookup("dappmanager.external", { family: 4 });
    resolvedIp = lookup.address;

    // Inspect dnpublic_network and find dappmanager container endpoint
    const nets = await docker.listNetworks({ filters: { name: [params.DOCKER_EXTERNAL_NETWORK_NAME] } });
    if (!nets.length) {
      return false;
    }

    const net = docker.getNetwork(nets[0].Id);
    const info = (await net.inspect()) as NetworkInspectInfo;

    const containers = info.Containers ?? {};
    for (const c of Object.values(containers)) {
      if (c?.Name === params.dappmanagerContainerName) {
        dappmanagerIp = (c.IPv4Address || "").split("/")[0] || null;
        break;
      }
    }
    if (!!resolvedIp && !!dappmanagerIp && resolvedIp === dappmanagerIp) return true;
    else {
      logs.error(
        `PWA Check - dappmanager.external (${resolvedIp}) does not point to dappmanager container IP (${dappmanagerIp})`
      );

      return false;
    }
  } catch (err) {
    logs.error("PWA Check - Error comparing dappmanager.external and dappmanager IP:", err);
    return false;
  }
}
