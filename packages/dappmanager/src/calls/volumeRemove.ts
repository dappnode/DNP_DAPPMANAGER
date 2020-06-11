import { dockerVolumeRm } from "../modules/docker/dockerCommands";
import { dockerVolumeInspect } from "../modules/docker/dockerApi";
import { shellHost } from "../utils/shell";
import * as eventBus from "../eventBus";
import params from "../params";
import { logs } from "../logs";

const mountpointDevicePrefix = params.MOUNTPOINT_DEVICE_PREFIX;

/**
 * Removes a docker volume by name
 *
 * @param name Full volume name: "bitcoindnpdappnodeeth_bitcoin_data"
 */
export async function volumeRemove({ name }: { name: string }): Promise<void> {
  if (!name) throw Error("kwarg name must be defined");

  await removeNamedVolume(name);

  // Emit packages update
  eventBus.requestPackages.emit();
}

/**
 * Check if the volume is a different device / mountpoint as a bind
 * If so, remove the volume data in the device path
 * volInfo = { ..., "Driver": "local",
 *   "Mountpoint": "/var/lib/docker/volumes/bitcoindnpdappnodeeth_bitcoin_data/_data",
 *   "Name": "bitcoindnpdappnodeeth_bitcoin_data",
 *   "Options": { "o": "bind", "type": "none",
 *     "device": "/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth/bitcoin_data" },
 *   "Scope": "local" }
 */
export async function removeNamedVolume(volName: string): Promise<void> {
  const volInfo = await dockerVolumeInspect(volName);
  if (
    volInfo.Options &&
    volInfo.Options.device &&
    volInfo.Driver === "local" &&
    volInfo.Options.o === "bind"
  ) {
    const devicePath = volInfo.Options.device;
    // WARNING: Make sure the device path is correct because
    // it could cause mayhem if empty or if it has a wrong value
    if (!devicePath) throw Error(`devicePath is empty`);
    if (!devicePath.includes(mountpointDevicePrefix))
      throw Error(
        `devicePath must contain the volume tag '${mountpointDevicePrefix}': ${devicePath}`
      );
    if (devicePath.length < 10)
      throw Error(`devicePath is too short: ${devicePath}`);

    // Using the `bash -c '$CMD' notation because otherwise the
    // '*' is expanded in the parent nsenter cmd, not in `rm -rf`
    await shellHost(`/bin/bash -- -c 'rm -rf ${devicePath}/*'`);
    logs.info(`Removed volume with custom device: ${devicePath}`);
  }

  // Remove docker volume for both custom binds and normal named volumes
  await dockerVolumeRm(volName);
}
