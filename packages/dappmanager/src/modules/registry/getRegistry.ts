import { DirectoryDnp } from "../../types";
import { ethers } from "ethers";
import { abi } from "../../contracts/registry";
import { isEnsDomain } from "../../utils/validate";
import { notUndefined } from "../../utils/typingHelpers";

// Topic name
const eventNewRepo = "NewRepo";

// Index of name in logs of Registry SC
const indexOfPackageName = 1;

export async function getRegistry(
  provider: ethers.providers.Provider,
  addressOrEnsName: string,
  fromBlock?: number,
  toBlock?: number
): Promise<DirectoryDnp[]> {
  const ensName = await provider.resolveName(addressOrEnsName);
  if (!ensName) throw Error(`ENS name ${ensName} does not exist`);

  const registryInterface = new ethers.utils.Interface(abi);

  const eventNewRepoTopic = getTopicFromEvent(registryInterface, eventNewRepo);

  const logs = await provider
    .getLogs({
      address: addressOrEnsName, // or contractEnsName,
      fromBlock: fromBlock || 0,
      toBlock: toBlock || "latest",
      topics: [eventNewRepoTopic]
    })
    .catch(e => {
      e.message = ` Error retrieving logs from ${addressOrEnsName}: ${e.message}`;
      throw e;
    });

  const parsedLogs = getParsedLogs(registryInterface, logs, eventNewRepoTopic);

  const dappNodePackagesNames = getArgFromParsedLogs(
    parsedLogs,
    indexOfPackageName
  );

  const numberOfDAppNodePackages = dappNodePackagesNames.length;

  const registryIds: number[] = [];
  for (let i = 0; i < numberOfDAppNodePackages; i++) {
    registryIds.push(i);
  }

  const packages = await Promise.all(
    registryIds.map(
      async (i): Promise<DirectoryDnp | undefined> => {
        const name = createFullPackageName(
          addressOrEnsName,
          dappNodePackagesNames[i]
        );
        // Make sure the DNP is not Deprecated or Deleted
        if (!isEnsDomain(name)) return;

        return {
          name,
          statusName: "Active",
          position: i,
          isFeatured: false,
          featuredIndex: 0
        };
      }
    )
  );

  return sortRegistryPackages(packages.filter(notUndefined));
}

// Utils

/** */
export function createFullPackageName(
  ensName: string,
  packageName: string
): string {
  return `${packageName}.${ensName}`;
}

/** Sort DAppNode packages alphabetically */
export function sortRegistryPackages(packages: DirectoryDnp[]): DirectoryDnp[] {
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/** Parse logs from hexadecimal format*/
export function getParsedLogs(
  iface: ethers.utils.Interface,
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

/** Get args from the log. There must be known the index of the arg to get */
export function getArgFromParsedLogs(
  parsedLogs: ethers.utils.LogDescription[],
  argDesiredIndex: number
): string[] {
  const logsResultArray = parsedLogs.map(parsedLog => parsedLog.values);

  const argsDesired: string[] = [];
  for (const logResult of logsResultArray) {
    const packageName = logResult[argDesiredIndex];
    if (packageName && !packageName.includes("0x"))
      argsDesired.push(packageName);
  }

  return argsDesired;
}

/** Get a topic from a given event, if either event or topic does not exist then error */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTopicFromEvent(
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
