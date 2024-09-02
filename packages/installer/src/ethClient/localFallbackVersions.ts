import fs from "fs";
import { params } from "@dappnode/params";
import { isNotFoundError } from "@dappnode/utils";

/**
 * contentHashes = {
 *   "geth.dnp.dappnode.eth": "/ipfs/QmNqDvqAyy3pN3PvymB6chM7S1FgYyive8LosVKUuaDdfd"
 * }
 */
interface ContentHashes {
  [dnpName: string]: string;
}

/**
 * Local fallback versions, to be able to install and eth client without connecting to remote
 * @param dnpName "geth.dnp.dappnode.eth"
 */
export function getLocalFallbackContentHash(dnpName: string): string | undefined {
  const contentHashes = loadContentHashes(params.FALLBACK_VERSIONS_PATH);
  return (contentHashes || {})[dnpName];
}

/**
 * Load local fallback content hash versions file
 * If the file does not exist, do not throw.
 */
export function loadContentHashes(filepath: string): ContentHashes | undefined {
  try {
    const packagesContentHashData = fs.readFileSync(filepath, "utf8");
    return parseContentHashFile(packagesContentHashData);
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
    return undefined;
  }
}

/**
 * Parse DNCORE/packages-content-hash.csv
 * data =
 * geth.dnp.dappnode.eth,/ipfs/QmNqDvqAyy3pN3PvymB6chM7S1FgYyive8LosVKUuaDdfd
 * openethereum.dnp.dappnode.eth,/ipfs/QmbHRZTW9ubWUGp41wbCVnVXaUoUmyM9Tv689EvLbRTQCK
 */
export function parseContentHashFile(data: string): ContentHashes {
  return data
    .trim()
    .split("\n")
    .reduce((contentHashes, row): ContentHashes => {
      const [dnpName, contentUri] = row.trim().split(",");
      return { ...contentHashes, [dnpName]: contentUri };
    }, {});
}
