import { Architecture } from "@dappnode/common";

/**
 * Returns the arch tag for the given architecture
 * @param arch Architecture in the format <os>/<arch>
 * @returns Arch tag in the format <os>-<arch>
 */
export const getArchTag = (arch: Architecture): string =>
  arch.replace(/\//g, "-");
