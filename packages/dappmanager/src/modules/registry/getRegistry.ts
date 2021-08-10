import { DirectoryDnp, RegistryNewRepoEvent } from "../../types";
import { ethers } from "ethers";
import { abi } from "../../contracts/registry";
import * as db from "../../db";
import { wrapError } from "../../utils/wrapError";

// Topic name
const eventNewRepo = "NewRepo";
const maxBlocksPerRequest = 100_000;
const minBlocksPerRequest = 5;
/** Failures are very slow, decrease size fast to get to a good range fast */
const blockStepDecrease = 4;
/** Successes are fast, don't increase too quickly to not trigger failures again too soon */
const blockStepIncrease = 2;

const minDeployBlock = 6312046;

export async function getRegistry(
  provider: ethers.providers.Provider,
  registryEns: string
): Promise<DirectoryDnp[]> {
  // Fetch only from latest fetched block
  // TODO: Allow users to introduce the deploy block
  const prevFetchedBlock =
    db.registryLastFetchedBlock.get(registryEns) || minDeployBlock;

  const latestBlock = await provider.getBlockNumber();

  // Persist progress to db
  function onEventsProgress(rangeEvents: RegistryNewRepoEvent[]): void {
    if (rangeEvents.length > 0) {
      const cachedLogs = db.registryEvents.get(registryEns) || [];
      for (const log of rangeEvents) cachedLogs.push(log);
      db.registryEvents.set(registryEns, cachedLogs);
    }
  }

  await getRegistryOnRange(
    provider,
    registryEns,
    prevFetchedBlock,
    latestBlock,
    onEventsProgress
  );

  const allEvents = db.registryEvents.get(registryEns) || [];

  return allEvents.map((event, i) => ({
    name: event.ensName,
    statusName: "Active",
    position: i,
    isFeatured: false,
    featuredIndex: 0
  }));
}

export async function getRegistryOnRange(
  provider: ethers.providers.Provider,
  registryEns: string,
  _fromBlock: number,
  _toBlock: number,
  onEvents?: (
    events: RegistryNewRepoEvent[],
    blockRange: [number, number]
  ) => void,
  onRetry?: (e: Error, blockRange: [number, number]) => void
): Promise<RegistryNewRepoEvent[]> {
  // TODO: Ensure registryEns is not an address, but an ENS domain
  const registryAddress = await provider.resolveName(registryEns);
  if (!registryAddress) {
    throw Error(`Registry ENS ${registryEns} does not exist`);
  }

  const registryInterface = new ethers.utils.Interface(abi);
  const eventNewRepoTopic = getTopicFromEvent(registryInterface, eventNewRepo);

  const events: RegistryNewRepoEvent[] = [];

  // Fetch events in a dynamic step depending on errors
  // Geth nodes may randomly take much longer to process logs on some sections of the chain
  let latestBlock = _fromBlock;
  let blockStep = maxBlocksPerRequest;

  while (latestBlock < _toBlock) {
    const from = latestBlock;
    const to = Math.min(latestBlock + blockStep, _toBlock);

    const logsResult = await wrapError(
      provider
        .getLogs({
          address: registryAddress,
          fromBlock: from,
          toBlock: to,
          topics: [eventNewRepoTopic]
        })
        .catch(e => {
          e.message = `Error retrieving logs from ${registryEns} [${from},${to}]: ${e.message}`;
          throw e;
        })
    );

    if (logsResult.err) {
      // On failure, decrease step
      if (blockStep <= minBlocksPerRequest) {
        throw logsResult.err;
      } else {
        if (onRetry) onRetry(logsResult.err, [from, to]);
        blockStep = Math.max(
          Math.floor(blockStep / blockStepDecrease),
          minBlocksPerRequest
        );
        continue;
      }
    } else {
      // On success, increase step
      blockStep = Math.min(blockStep * blockStepIncrease, maxBlocksPerRequest);
      latestBlock = to;
    }

    const rangeEvents = await Promise.all(
      logsResult.result.map(async log => {
        const event = registryInterface.parseLog(log);
        if (!log.blockNumber) {
          throw Error(`${eventNewRepo} log has no blockNumber`);
        }
        if (!log.transactionHash) {
          throw Error(
            `${eventNewRepo} log at ${log.blockNumber} has no txHash`
          );
        }
        if (!event.values) {
          throw Error(
            `${eventNewRepo} event at ${log.blockNumber} has no values`
          );
        }
        const name = event.values.name as string;
        const block = await provider.getBlock(log.blockNumber);
        return {
          ensName: `${name}.${registryEns}`,
          timestamp: block.timestamp,
          txHash: log.transactionHash
        };
      })
    );

    for (const event of rangeEvents) {
      events.push(event);
    }

    if (onEvents) onEvents(rangeEvents, [from, to]);
  }

  return events;
}

// Utils

/** Get a topic from a given event, if either event or topic does not exist then error */
function getTopicFromEvent(
  iface: ethers.utils.Interface,
  eventName: string
): string {
  const event = Object.values(iface.events).find(
    eventValue => eventValue.name === eventName
  );
  if (!event) throw Error(`Event ${eventName} not found`);
  const topic = event.topic;
  if (!topic) throw Error(`Topic not found on event ${event}`);
  return topic;
}
