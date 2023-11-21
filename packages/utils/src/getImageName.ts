import { Architecture } from "@dappnode/common";
import { getArchTag } from "./getArchTag.js";

/**
 * Returns the image path for the given container name, version and architecture
 * @param name Container name
 * @param version Container version
 * @param arch Container architecture in the format <os>/<arch>
 * @returns Image path in the format <name>_<version>_<os>-<arch>.txz
 */
export const getImageName = (
  name: string,
  version: string,
  arch: Architecture
): string => `${name}_${version}_${getArchTag(arch)}.txz`;
