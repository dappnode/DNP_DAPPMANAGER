import path from "path";
import { params } from "@dappnode/params";

/**
 * Returns the local filesystem path where the avatar for a package should be stored.
 * Core packages store avatars under DNCORE_DIR/avatars/, non-core under REPO_DIR/avatars/.
 * @param dnpName - e.g. "bitcoin.dnp.dappnode.eth"
 * @param isCore - whether the package is a core package
 * @returns e.g. "/usr/src/app/dnp_repo/avatars/bitcoin.dnp.dappnode.eth.png"
 */
export function getAvatarPath(dnpName: string, isCore: boolean): string {
  const dir = isCore ? params.coreAvatarStaticDir : params.avatarStaticDir;
  return path.join(dir, `${dnpName}.png`);
}
