import Dockerode from "dockerode";
import { docker } from "./docker";

/**
 * List docker images
 * @param options Example:
 * options = {
 *   filters: {
 *     reference: ["dappmanager.dnp.dappnode.eth"]
 *   }
 * }
 */
export async function imagesList(): Promise<Dockerode.ImageInfo[]> {
  return docker.listImages();
}
