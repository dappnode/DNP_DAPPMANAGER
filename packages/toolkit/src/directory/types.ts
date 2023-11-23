import { Manifest } from "@dappnode/common";

/**
 * ==========================
 * SMART CONTRACT - DIRECTORY
 * ==========================
 * [NOTE] Items MUST be ordered by the directory order
 * - featured #0
 * - featured #1
 * - whitelisted #0
 * - whitelisted #1
 * - whitelisted #2
 * - other #0
 * - other #1
 *
 * [NOTE] Search result will never show up in the directory listing,
 * they will appear in a future dropdown under the searchbar
 *
 * Information immediatelly available in the directory smart contract
 */

export const directoryDnpStatus = ["Deleted", "Active", "Developing"] as const;
export type DirectoryDnpStatus = (typeof directoryDnpStatus)[number];
export interface DirectoryDnp {
  name: string;
  statusName: DirectoryDnpStatus;
  position: number;
  isFeatured: boolean;
  featuredIndex: number;
  manifest?: Manifest;
  avatar?: string;
}
