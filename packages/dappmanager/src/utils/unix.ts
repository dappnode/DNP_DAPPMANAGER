import path from "path";

export interface DuResult {
  size: string; // Bytes: "9080"
  path: string; // Normalized path "node_modules/eslint"
}

/**
 * Parses and output of the `du` unix command
 * Allows a `relativeFrom` parameter to compute the subpaths from it
 * @param output = `
 * 824204	/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth/bitcoin_data
 * 824208	/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth
 * 824212	/mnt/volume_ams3_01/dappnode-volumes`
 * @param relativeFrom = "/mnt/volume_ams3_01/dappnode-volumes"
 * @returns pathSizesArray = [
 *   { size: "824204", path: "bitcoin.dnp.dappnode.eth/bitcoin_data" },
 *   { size: "824208", path: "bitcoin.dnp.dappnode.eth" },
 *   { size: "824212", path: "." }
 * ]
 */
export function parseDuOutput(
  output: string,
  relativeFrom?: string
): DuResult[] {
  return output
    .trim()
    .split("\n")
    .map(line => {
      const [size, subpath] = line.trim().split(/\s+/);
      return {
        path: path.normalize(
          relativeFrom ? path.relative(relativeFrom, subpath) : subpath
        ),
        size
      };
    });
}
