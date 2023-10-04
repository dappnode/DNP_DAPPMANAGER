import { isEmpty } from "lodash-es";
import { shellHost } from "@dappnode/utils";
import { parseDevicePath } from "@dappnode/dockercompose";

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

import path from "path";

export interface DuResult {
  size: string; // Bytes: "9080"
  path: string; // Normalized path "node_modules/eslint"
}

/**
 * Parses and output of the `du` unix command
 * Allows a `relativeFrom` parameter to compute the subpaths from it
 * @param output = `
 * 824204	/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth/bitcoin_data
 * 824208	/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth
 * 824212	/mnt/volume_ams3_01/dappnode-volumes`
 * @param relativeFrom = "/mnt/volume_ams3_01/dappnode-volumes"
 * @returns pathSizesArray = [
 *   { size: "824204", path: "bitcoin.dnp.dappnode.eth/bitcoin_data" },
 *   { size: "824208", path: "bitcoin.dnp.dappnode.eth" },
 *   { size: "824212", path: "." }
 * ]
 */
export function parseDuOutput(
  output: string,
  relativeFrom?: string
): DuResult[] {
  return output
    .trim()
    .split("\n")
    .map((line) => {
      const [size, subpath] = line.trim().split(/\s+/);
      return {
        path: path.normalize(
          relativeFrom ? path.relative(relativeFrom, subpath) : subpath
        ),
        size,
      };
    });
}
