import { InstalledPackageData, PortMapping } from "@dappnode/types";
import { prettyDnpName } from "utils/format";

export const maxPortNumber = 65535;
export const maxRegisteredPortNumber = 32768 - 1;
export const wireguardPort = 51820;

export function portsToId(portMappings: PortMapping[]): string {
  return portMappings.map(({ host, container, protocol }) => [host, container, protocol].join("")).join("");
}

export function getHostPortMappings(dnps: InstalledPackageData[]) {
  const map: Record<string, string> = {};
  for (const dnp of dnps)
    for (const container of dnp.containers)
      for (const port of container.ports || []) if (port.host) map[`${port.host}/${port.protocol}`] = dnp.dnpName;
  return map;
}

export function findDuplicates(ports: PortMapping[], field: "host" | "container"): PortMapping[] {
  const seen = new Set<string>();
  return ports.filter((p) => {
    const val = p[field];
    if (!val) return false;
    const key = `${val}-${p.protocol}`;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
}

export function getPortErrors(
  ports: PortMapping[],
  dnpName: string,
  hostPortMapping: Record<string, string>
): { errors: string[]; warnings: string[] } {
  const duplicatedHost = findDuplicates(ports, "host");
  const duplicatedContainer = findDuplicates(ports, "container");
  const conflicting = ports.filter((p) => {
    const owner = hostPortMapping[`${p.host}/${p.protocol}`];
    return owner && owner !== dnpName;
  });

  const errors: string[] = [];
  duplicatedHost.forEach((p) => errors.push(`Duplicated host port ${p.host}/${p.protocol}`));
  duplicatedContainer.forEach((p) => errors.push(`Duplicated container port ${p.container}/${p.protocol}`));
  conflicting.forEach((p) => {
    const owner = hostPortMapping[`${p.host}/${p.protocol}`];
    errors.push(`Port ${p.host}/${p.protocol} is used by ${prettyDnpName(owner)}`);
  });

  const warnings: string[] = [];
  ports.forEach((p) => {
    if (
      p.deletable &&
      p.host &&
      p.host > maxRegisteredPortNumber &&
      p.host <= maxPortNumber &&
      p.host !== wireguardPort
    )
      warnings.push(`Host port ${p.host}/${p.protocol} is in the ephemeral range`);
  });

  return { errors, warnings };
}
