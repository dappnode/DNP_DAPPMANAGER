import { RootState } from "rootReducer";
import {
  wifiName,
  ipfsName,
  wifiDefaultSSID,
  wifiDefaultWPA_PASSPHRASE,
  wifiEnvWPA_PASSPHRASE,
  wifiEnvSSID
} from "params";
import { PackageContainer } from "types";

// Service > dnpInstalled

export const getDnpInstalled = (state: RootState): PackageContainer[] =>
  state.dnpInstalled.dnpInstalled;
export const getDnpInstalledStatus = (state: RootState) =>
  state.dnpInstalled.requestStatus;

export const getWifiCredentials = (
  state: RootState
): { ssid: string; pass: string } | null => {
  const dnps = getDnpInstalled(state);
  const wifiDnp = dnps.find(dnp => dnp.name === wifiName);
  if (!wifiDnp || !wifiDnp.envs) return null;
  return {
    ssid: wifiDnp.envs[wifiEnvSSID],
    pass: wifiDnp.envs[wifiEnvWPA_PASSPHRASE]
  };
};

/**
 * Check if the wifi DNP has the same credentials as the default ones
 * @returns credentials are the same as the default ones
 */
export const getAreWifiCredentialsDefault = (state: RootState): boolean => {
  const wifiCredentials = getWifiCredentials(state);
  if (!wifiCredentials) return false;
  return (
    wifiCredentials.pass === wifiDefaultWPA_PASSPHRASE &&
    wifiCredentials.ssid === wifiDefaultSSID
  );
};

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
