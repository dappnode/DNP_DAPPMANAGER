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
 * @returns Promise<DockerImageInfo[]>
 * ```
 * {
        Containers: -1,
        Created: 1643703266,
        Id: "sha256:f214cf9544ca5e0078082e629b7a2181d14a5cbc6df22a85d64ea06141a1bedb",
        Labels: null,
        ParentId: "",
        RepoDigests: null,
        RepoTags: ["beacon-chain.prysm-prater.dnp.dappnode.eth:0.1.7"],
        SharedSize: -1,
        Size: 174829283,
        VirtualSize: 174829283
      }
  * ```
 */
export async function imagesList(
  options?: DockerApiListImagesOptions
): Promise<DockerImageInfo[]> {
  return docker.listImages(options) as Promise<DockerImageInfo[]>;
}
export interface DockerImageInfo
  extends Omit<Dockerode.ImageInfo, "RepoDigests" | "Labels" | "RepoTags"> {
  Containers: number;
  SharedSize: number;
  RepoTags: string[] | null;
  RepoDigests?: string[] | null;
  Labels: { [label: string]: string } | null;
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
