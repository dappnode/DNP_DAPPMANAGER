import { isEmpty } from "lodash-es";
import { shellHost } from "../../utils/shell";
import { parseDuOutput } from "../../utils/unix";
import { parseDevicePath } from "../compose";

interface VolDevicePaths {
  [volumeName: string]: string;
}
interface VolSizes {
  [volumeName: string]: string;
}

/**
 * Checks the disk size of volume device paths.
 * Returned size is in BYTES
 * @param volDevicePaths = {
 *   bitcoin_data: "/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth/bitcoin_data"
 * }
 * @returns volSizes = {
 *   bitcoin_data: "823203"
 * }
 */
export async function getHostVolumeSizes(
  volDevicePaths: VolDevicePaths
): Promise<VolSizes> {
  // if there are no volDevicePaths, return early
  if (isEmpty(volDevicePaths)) return {};

  // Aggregate the devicePaths by mountpoint to minimize the # of calls
  // to script shell hosts
  const mountpoints: {
    [mountpointPath: string]: {
      [volName: string]: string;
    };
  } = {};

  for (const [volName, devicePath] of Object.entries(volDevicePaths)) {
    const pathParts = parseDevicePath(devicePath);
    if (!pathParts) throw Error(`Error parsing device path ${devicePath}`);
    const { mountpointPath, volumePath } = pathParts;
    if (!mountpoints[mountpointPath]) mountpoints[mountpointPath] = {};
    mountpoints[mountpointPath][volName] = volumePath;
  }

  const volSizes: VolSizes = {};

  for (const [mountpointPath, volumeSubPaths] of Object.entries(mountpoints)) {
    const sizeByPath = await duHostMountpoints(mountpointPath);
    for (const [volName, volSubPath] of Object.entries(volumeSubPaths)) {
      volSizes[volName] = sizeByPath[volSubPath];
    }
  }

  return volSizes;
}

interface SizeByPath {
  [path: string]: string;
}

/**
 * Calls `du` on the host to get the volumes size.
 * Returns results in BYTES.
 * Assumes the following path structure, so it calls only with depth 2.
 *
 * root@DAppNodeLion:/mnt/volume_ams3_01/dappnode-volumes# du -d 2
 * 824204410	./bitcoin.dnp.dappnode.eth/bitcoin_data
 * 824208410	./bitcoin.dnp.dappnode.eth
 * 824212410	.
 *
 * @param mountpointPath
 */
async function duHostMountpoints(mountpointPath: string): Promise<SizeByPath> {
  // -d 2 = Show directories of max depth 2
  // -B 1 = User SIZE-byte blocks of 1, bytes
  const duOutput = await shellHost(`du -- -d 2 -B 1 ${mountpointPath}`);
  return parseDuOutput(duOutput, mountpointPath).reduce(
    (obj: SizeByPath, { size, path }) => {
      return { ...obj, [path]: size };
    },
    {}
  );
}
