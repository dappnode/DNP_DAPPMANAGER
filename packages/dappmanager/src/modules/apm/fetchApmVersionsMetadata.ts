import { ethers } from "ethers";
import { ApmVersionMetadata } from "./types";
import { getTimestamp } from "./apmUtils";
import { Interface } from "ethers/lib/utils";
import { abi } from "../../contracts/registry";

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

  const repo = new ethers.utils.Interface(abi);

  const result = await provider.getLogs({
    address: addressOrEnsName, // or contractEnsName,
    fromBlock: fromBlock || 0,
    toBlock: "latest",
    topics: [getTopicFromEvent(repo, "NewVersion")]
  });

  return await Promise.all(
    result.map(
      async (log): Promise<ApmVersionMetadata> => {
        // Parse values
        const parsedLog = repo.parseLog(log);

        if (!parsedLog || !parsedLog.args)
          throw Error(`Error parsing NewRepo event`);
        // const versionId = parsedLog.values.versionId.toNumber();
        return {
          version: parsedLog.args.semanticVersion.join("."),
          // Parse tx data
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: await getTimestamp(log.blockNumber, provider)
        };
      }
    )
  );
}

// Utils

export function getParsedLogs(
  iface: Interface,
  logs: ethers.providers.Log[],
  topic: string
): ethers.utils.LogDescription[] {
  const parsedLogs: ethers.utils.LogDescription[] = [];
  for (const log of logs) {
    if (!log.topics.find(logTopic => logTopic === topic))
      throw Error(`Topic ${topic} not found`);
    parsedLogs.push(iface.parseLog(log));
  }
  return parsedLogs;
}

export function getArgFromParsedLogs(
  parsedLogs: ethers.utils.LogDescription[],
  argDesired: string
): string[] {
  const logsResultArray = parsedLogs.map(parsedLog => parsedLog.args);

  const argsDesired: string[] = [];
  for (const logResult of logsResultArray) {
    for (const arg of logResult) {
      if (Object.keys(arg) === [argDesired]) argsDesired.push(arg.name);
    }
  }

  return argsDesired;
}

/** Get a topic from a given event, if either of event or topic does not exist error */
export function getTopicFromEvent(iface: Interface, eventName: string): string {
  const event = Object.values(iface.events).find(
    eventValue => eventValue.name === eventName
  );
  if (!event) throw Error(`Event ${eventName} not found`);
  const topic = iface.getEventTopic(event);
  if (!topic) throw Error(`Topic not found on event ${event}`);
  return topic;
}
