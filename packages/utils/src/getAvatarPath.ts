import path from "path";
import { params } from "@dappnode/params";

/**
 * Returns the local filesystem path where the avatar for a package should be stored.
 * @param dnpName - e.g. "bitcoin.dnp.dappnode.eth"
 * @returns e.g. "/usr/src/app/dnp_repo/avatars/bitcoin.dnp.dappnode.eth.png"
 */
export function getAvatarPath(dnpName: string): string {
  return path.join(params.avatarStaticDir, `${dnpName}.png`);
}
