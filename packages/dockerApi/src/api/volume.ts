import Docker, { VolumeRemoveOptions } from "dockerode";
import { docker } from "./docker.js";

export async function dockerVolumeInspect(
  volumeName: string
): Promise<Docker.VolumeInspectInfo> {
  const volume = docker.getVolume(volumeName);
  return await volume.inspect();
}

/**
 * Force the removal of the volume
 */
export async function dockerVolumeRemove(volumeName: string): Promise<void> {
  const volume = docker.getVolume(volumeName);
  // TODO: remove the type assertion when the type is fixed in dockerode
  // github issue: https://github.com/apocas/dockerode/issues/772
  // github discussion: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/69574
  // volume.remove code from dockerode: https://github.com/apocas/dockerode/blob/49bd8c4c231efe9bb432b28d51dbae3e50ddd010/lib/volume.js#L57
  await volume.remove({ force: true } as VolumeRemoveOptions);
}
