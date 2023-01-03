import { listContainers as dockerApiListContainers } from "../api";
import { PackageContainer } from "@dappnode/common";
import { parseContainerInfo } from "./parseContainerInfo";

/**
 * Returns the list of containers
 * [NOTE] On a full DAppNode will 14 containers the call takes 17ms on average
 * @returns
 */
export async function listContainers(filters?: {
  containerName: string;
}): Promise<PackageContainer[]> {
  const containers = await dockerApiListContainers(
    filters ? { filters: { name: [filters.containerName] } } : {}
  );

  return containers
    .map(parseContainerInfo)
    .filter(pkg => pkg.isDnp || pkg.isCore);
}

export async function listContainerNoThrow({
  containerName
}: {
  containerName: string;
}): Promise<PackageContainer | null> {
  const containers = await listContainers({ containerName });
  // When querying "geth.dnp.dappnode.eth", if user has "goerli-geth.dnp.dappnode.eth"
  // The latter can be returned as the original container.
  // Return an exact match for
  // - containerName "DAppNodePackage-geth.dnp.dappnode.eth"
  // - name: "geth.dnp.dappnode.eth"
  const matches = containers.filter(
    container => container.containerName === containerName
  );
  if (matches.length > 1)
    throw Error(`Multiple matches found for ${containerName}`);
  return matches[0] || null;
}

export async function listContainer({
  containerName
}: {
  containerName: string;
}): Promise<PackageContainer> {
  const container = await listContainerNoThrow({ containerName });
  if (!container) throw Error(`${containerName} package not found`);
  return container;
}
