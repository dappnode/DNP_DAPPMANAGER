import Docker from "dockerode";
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
  await volume.remove({ force: true });
}
