import { PackageContainer } from "../../common";

/**
 * When fetching logs from the API, each line is prefixed by a Header
 *
 * It is encoded on the first 8 bytes like this:
 *
 *    header := [8]byte{STREAM_TYPE, 0, 0, 0, SIZE1, SIZE2, SIZE3, SIZE4}
 *
 * `STREAM_TYPE` can be:
 *
 * -   0: stdin (will be written on stdout)
 * -   1: stdout
 * -   2: stderr
 *
 * `SIZE1, SIZE2, SIZE3, SIZE4` are the 4 bytes of
 * the uint32 size encoded as big endian.
 *
 * Example:
 *
 * \u0001\u0000\u0000\u0000\u0000\u0000\u0000O\u001b[32minfo\u001b[39m Starting cache DB cacheDbPath: \"/usr/src/app/data/cachedb.json\"\n\n
 * \u0001\u0000\u0000\u0000\u0000\u0000\u0000L\u001b[32minfo\u001b[39m IPFS HTTP API httpApiUrl: \"http://ipfs.dappnode:5001/api/v0\"\n
 * \u0001\u0000\u0000\u0000\u0000\u0000\u0000X\u001b[32minfo\u001b[39m IPFS Cluster HTTP API clusterApiUrl: \"http://ipfs-cluster.dappnode:9094\"\n
 * \u0001\u0000\u0000\u0000\u0000\u0000\u0000N\u001b[32minfo\u001b[39m Web3 connected (ethers 4.0.39): http://fullnode.dappnode:8545 \n
 * \u0001\u0000\u0000\u0000\u0000\u0000\u00003\u001b[32minfo\u001b[39m Webserver on 80, /usr/src/app/dist \n
 *
 * Where
 *
 * \u0001\u0000\u0000\u0000\u0000\u0000\u0000O
 *
 * is the header
 */
export function stripDockerApiLogsHeader(logs: string): string {
  return logs
    .split("\n")
    .map(stripDockerApiLogHeader)
    .join("\n");
}

function stripDockerApiLogHeader(line: string): string {
  if (line[1] === "\u0000" && line[2] === "\u0000" && line[3] === "\u0000") {
    // Has log, remove first 8 bytes
    return line.substring(8);
  } else {
    return line;
  }
}

/**
 * Returns the maximum dockerTimeout param from the container or undefined if none
 * @param containers
 */
export function getDockerTimeoutMax(
  containers: PackageContainer[]
): number | undefined {
  let timeout: number | undefined = undefined;

  for (const container of containers) {
    if (container.dockerTimeout) {
      const timeoutNumber = parseInt(container.dockerTimeout);
      if (!timeout || timeoutNumber > timeout) {
        timeout = timeoutNumber;
      }
    }
  }
  return timeout;
}
