import { RegistryNewRepoEvent } from "../../types";
import { ethers } from "ethers";
import { abi } from "../../contracts/registry";
import * as db from "../../db";
import { wrapError } from "../../utils/wrapError";
import { DirectoryDnp } from "@dappnode/common";

// Topic name
const eventNewRepo = "NewRepo";
const maxBlocksPerRequest = 100_000;
const minBlocksPerRequest = 5;
/** Failures are very slow, decrease size fast to get to a good range fast */
const blockStepDecrease = 4;
/** Successes are fast, don't increase too quickly to not trigger failures again too soon */
const blockStepIncrease = 2;

const maxBlocksBehind = 100;

/** Return the newRepos from registry not cached already scanning the chain if necessary. */
export async function getRegistry(
  provider: ethers.providers.Provider,
  registryEns: string,
  fromBlock: number
): Promise<DirectoryDnp[]> {
  // Fetch only from latest fetched block
  // TODO: Allow users to introduce the deploy block

  // Get from and to blocks
  const prevFetchedBlock =
    db.registryLastFetchedBlock.get(registryEns) || fromBlock;
  const latestBlock = await provider.getBlockNumber();

  // Get registry cache
  const registryEvents = db.registryEvents.get(registryEns);

  // Update latest chain block in cache
  db.registryLastProviderBlock.set(latestBlock);

  // Return cache if we have scanned close enough to the head
  if (registryEvents && prevFetchedBlock + maxBlocksBehind > latestBlock)
    return getRegistryCached(registryEns);

  // Persist progress to db if does not exist already
  function onEventsProgress(rangeEvents: RegistryNewRepoEvent[]): void {
    if (rangeEvents.length > 0) {
      const cachedLogs = db.registryEvents.get(registryEns) || [];
      const cachedLogsStringify = cachedLogs.map(cachedLog =>
        JSON.stringify(cachedLog)
      );
      for (const log of rangeEvents) {
        if (!cachedLogsStringify.includes(JSON.stringify(log)))
          cachedLogs.push(log);
      }
      db.registryEvents.set(registryEns, cachedLogs);
    }
  }

  const registryNotCached = await getRegistryOnRange(
    provider,
    registryEns,
    prevFetchedBlock,
    latestBlock,
    onEventsProgress
  );

  return getMockData(sortPackagesByTimestamp(registryNotCached));
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
        if (!event.args) {
          throw Error(
            `${eventNewRepo} event at ${log.blockNumber} has no args`
          );
        }
        const name = event.args.name as string;
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

    // Update latest fetched block in db
    db.registryLastFetchedBlock.set(registryEns, to);
  }

  return events;
}

/** Return the cache from the demmanded registry */
function getRegistryCached(registryEns: string): DirectoryDnp[] {
  const registryCached = db.registryEvents.get(registryEns);
  if (registryCached)
    return getMockData(sortPackagesByTimestamp(registryCached));
  return [];
}

// Utils

/** Get a topic in hex format from a given event, if either event or topic does not exist then error */
function getTopicFromEvent(
  iface: ethers.utils.Interface,
  eventName: string
): string {
  const event = Object.values(iface.events).find(
    eventValue => eventValue.name === eventName
  );
  if (!event) throw Error(`Event ${eventName} not found`);
  const topic = event.name;
  if (!topic) throw Error(`Topic not found on event ${event}`);
  return iface.getEventTopic(event);
}

/** Sort packages in descendent order by timestamp (newest first) */
function sortPackagesByTimestamp(
  packages: RegistryNewRepoEvent[]
): RegistryNewRepoEvent[] {
  return packages.sort((a, b) => b.timestamp - a.timestamp);
}

/** Creates mock data for DnpDirectory */
function getMockData(registry: RegistryNewRepoEvent[]): DirectoryDnp[] {
  return registry.map((registryEvent, i) => {
    return {
      name: registryEvent.ensName,
      statusName: "Active",
      position: i,
      isFeatured: false,
      featuredIndex: 0
    };
  });
}
