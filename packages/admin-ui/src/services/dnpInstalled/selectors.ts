import { RootState } from "rootReducer";
import { ipfsName } from "params";
import { PackageContainer } from "types";

// Service > dnpInstalled

export const getDnpInstalled = (state: RootState): PackageContainer[] =>
  state.dnpInstalled.dnpInstalled;

/**
 * Returns object ready to check if a port is used or not
 */
export const getHostPortMappings = (state: RootState) => {
  const dnps = getDnpInstalled(state);
  const hostPortMappings: { [portId: string]: string } = {};
  for (const dnp of dnps)
    for (const port of dnp.ports || [])
      if (port.host)
        hostPortMappings[`${port.host}/${port.protocol}`] = dnp.name;
  return hostPortMappings;
};

interface VolumeStats {
  name: string;
  size: number;
}

/**
 * Returns the volume sizes of `ipfs` DNPs
 * - ipfs.dnp.dappnode.eth > dncore_ipfsdnpdappnodeeth_data
 */
export const getDappnodeVolumes = (state: RootState): VolumeStats[] => {
  const dnps = getDnpInstalled(state);

  const volumeStats: VolumeStats[] = [];

  const findDnp = (name: string) => dnps.find(dnp => dnp.name === name);
  const findVolume = (dnp: PackageContainer, name: string) =>
    (dnp.volumes || []).find(vol => (vol.name || "").endsWith(name));

  const ipfsDnp = findDnp(ipfsName);
  if (ipfsDnp) {
    const ipfsDataVolume = findVolume(ipfsDnp, "_data");
    if (ipfsDataVolume)
      volumeStats.push({ name: "Ipfs size", size: ipfsDataVolume.size || 0 });
  }

  return volumeStats;
};

/**
 * Regular selectors, called outside of a normal react-redux situation
 */

export const getDnpInstalledById = (state: RootState, id: string) =>
  getDnpInstalled(state).find(({ name }) => name === id);

export const getDependantsOfId = (state: RootState, id: string) =>
  getDnpInstalled(state)
    .filter(dnp => dnp.dependencies && dnp.dependencies[id])
    .map(dnp => dnp.name);
