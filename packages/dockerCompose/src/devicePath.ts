import path from "path";

const params = {
  MOUNTPOINT_DEVICE_PREFIX: "dappnode-volumes"
};

/**
 * Gets a device path and sanitizes the parts
 * - For dnpName and volumeName only tolerates
 *   alphanumeric characters and "-", "."
 * - The mountpoint must be an absolute path
 *
 * @returns devicePath = "/dev1/data/dappnode-volumes/bitcoin.dnp.dappnode.eth/data"
 */
export function getDevicePath({
  mountpoint,
  dnpName,
  volumeName
}: {
  mountpoint: string;
  dnpName: string;
  volumeName: string;
}): string {
  if (!path.isAbsolute(mountpoint))
    throw Error(`mountpoint path for '${dnpName} - ${volumeName}' must be an absolute path: ${mountpoint}`);

  const stripCharacters = (s: string): string =>
    s.replace(/[`~!@#$%^&*()|+=?;:'",<>{}[\]\\/]/gi, "").replace(/\.+/, ".");

  return path.join(mountpoint, params.MOUNTPOINT_DEVICE_PREFIX, stripCharacters(dnpName), stripCharacters(volumeName));
}

/**
 * Reverses the result of `getDevicePath`
 * @param devicePath "/dev1/data/dappnode-volumes/bitcoin.dnp.dappnode.eth/data"
 * @returns path parts = {
 *   mountpoint: "/dev1/data",
 *   dnpName: "bitcoin.dnp.dappnode.eth",
 *   volumeName: "data",
 *   volumePath: "bitcoin.dnp.dappnode.eth/data",
 *   mountpointPath: "/dev1/data/dappnode-volumes"
 * }
 */
export function parseDevicePath(devicePath: string):
  | {
      mountpoint: string;
      dnpName: string;
      volumeName: string;
      volumePath: string;
      mountpointPath: string;
    }
  | undefined {
  // The docker API is not perfectly typed, devicePath may be undefined
  const [mountpoint, dnpNameAndVolumeName] = (devicePath || "").split("/" + params.MOUNTPOINT_DEVICE_PREFIX + "/");
  if (!dnpNameAndVolumeName) return;
  const [dnpName, volumeName] = (dnpNameAndVolumeName || "").split("/");
  if (!volumeName) return;
  return {
    mountpoint: path.normalize(mountpoint),
    dnpName,
    volumeName,
    volumePath: dnpNameAndVolumeName,
    mountpointPath: path.join(mountpoint, params.MOUNTPOINT_DEVICE_PREFIX)
  };
}

export function parseDevicePathMountpoint(devicePath: string): string | undefined {
  const pathParts = parseDevicePath(devicePath);
  return pathParts ? pathParts.mountpoint : undefined;
}
