import Web3 from "web3";
// import web3 utils
import { toUtf8 } from "web3-utils";
import semver from "semver";
import { ApmRepoVersionReturn } from "./types";

/**
 * Parse a raw version response from an APM repo
 */
export function parseApmVersionReturn(res: ApmRepoVersionReturn): {
  version: string;
  contentUri: string;
} {
  if (!Array.isArray(res.semanticVersion))
    throw Error(`property 'semanticVersion' must be an array`);
  return {
    version: res.semanticVersion.join("."),
    // Second argument = true: ignore UTF8 parsing errors
    // Let downstream code identify the content hash as wrong
    contentUri: toUtf8(res.contentURI)
  };
}

/**
 * Return a semantic version string into the APM version array format
 * @param version "0.2.4"
 */
export function toApmVersionArray(version: string): [number, number, number] {
  const semverObj = semver.parse(version);
  if (!semverObj) throw Error(`Invalid semver ${version}`);
  return [semverObj.major, semverObj.minor, semverObj.patch];
}

/**
 * Return evenly spaced numbers over a specified interval.
 * @param from 1
 * @param to 5
 * @param step 2
 * @returns [1, 3, 5]
 */
export function linspace(from: number, to: number, step = 1): number[] {
  // Guard against bugs that can cause // -Infinity
  if (!isFinite(from)) throw Error(`linspace 'from' is not finite: ${from}`);
  if (!isFinite(to)) throw Error(`linspace 'to' is not finite: ${to}`);
  const arr: number[] = [];
  for (let i = from; i <= to; i += step) arr.push(i);
  return arr;
}

/**
 * Fetch a block's timestamp
 * @param blockNumber
 * @param provider
 */
export async function getTimestamp(
  blockNumber: number | undefined,
  web3: Web3
): Promise<number | undefined> {
  if (!blockNumber) return;
  const block = await web3.eth.getBlock(blockNumber);
  if (typeof block.timestamp !== "number") return parseInt(block.timestamp);
  return block.timestamp;
}
