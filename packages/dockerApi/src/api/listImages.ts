import Dockerode from "dockerode";
import { docker } from "./docker.js";

/**
 * List docker images
 * @param options Example:
 * options = {
 *   filters: {
 *     reference: ["dappmanager.dnp.dappnode.eth"]
 *   }
 * }
 */
export async function imagesList(
  options?: DockerApiListImagesOptions
): Promise<Dockerode.ImageInfo[]> {
  return docker.listImages(options as Dockerode.ListImagesOptions) as Promise<
    Dockerode.ImageInfo[]
  >;
}

export interface DockerApiListImagesOptions {
  /**
   * Show all images. Only images from a final layer (no children) are shown by default.
   */
  all?: boolean;
  /**
   * A JSON encoded value of the filters (a map[string][]string) to process on the images list. Available filters:
   */
  filters?: {
    /**
     * (<image-name>[:<tag>], <image id> or <image@digest>),
     */
    before?: string;
    dangling?: Record<string, unknown>;
    /**
     * key or label="key=value" of an image label
     */
    label?: string[];
    /**
     * (<image-name>[:<tag>])
     * Partial RepoTag, i.e. "dappmanager.dnp.dappnode.eth"
     */
    reference?: string[];
    /**
     * (<image-name>[:<tag>], <image id> or <image@digest>)
     */
    since?: string;
  };
  /**
   * Show digest information as a RepoDigests field on each image
   */
  digests?: boolean;
}
