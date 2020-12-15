import Docker from "dockerode";
import { docker } from "./docker";

export function dockerVolumeInspect(
  volumeName: string
): Promise<Docker.VolumeInspectInfo> {
  const volume = docker.getVolume(volumeName);
  return volume.inspect();
}
