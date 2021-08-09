import { ethers } from "ethers";
import { ApmVersionMetadata } from "./types";
import { getTimestamp } from "./apmUtils";

const repoAbi = [
  "event NewVersion(uint256 versionId, uint16[3] semanticVersion)"
];

/**
 * Fetches the new repos logs from a registry
 *
 * [NOTE]: Will throw with "ENS name not configured" if the ENS can't
 * resolve the domain
 */
export async function fetchApmVersionsMetadata(
  provider: ethers.providers.Provider,
  addressOrEnsName: string,
  fromBlock?: number
): Promise<ApmVersionMetadata[]> {
  // Change this method if the web3 library is not ethjs
  // await ensureAncientBlocks();

  const repo = new ethers.utils.Interface(repoAbi);

  const event = repo.events;

  const topic = event.topic.topic;

  const result = await provider.getLogs({
    address: addressOrEnsName, // or contractEnsName,
    fromBlock: fromBlock || 0,
    toBlock: "latest",
    topics: [topic]
  });

  return await Promise.all(
    result.map(
      async (log): Promise<ApmVersionMetadata> => {
        // Parse values
        const parsedLog = repo.parseLog(log);

        if (!parsedLog || !parsedLog.values)
          throw Error(`Error parsing NewRepo event`);
        // const versionId = parsedLog.values.versionId.toNumber();
        return {
          version: parsedLog.values.semanticVersion.join("."),
          // Parse tx data
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: await getTimestamp(log.blockNumber, provider)
        };
      }
    )
  );
}
