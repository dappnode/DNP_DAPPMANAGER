import { ethers } from "ethers";
import semver from "semver";
import { ApmVersion } from "../../../types";

interface ApmRepoVersionReturn {
  semanticVersion: number[]; // uint16[3]
  contractAddress: string; // address
  contentURI: string; // bytes
}

/**
 * Parse a raw version response from an APM repo
 */
export function parseApmVersionReturn(res: ApmRepoVersionReturn): ApmVersion {
  return {
    version: res.semanticVersion.join("."),
    // Second argument = true: ignore UTF8 parsing errors
    // Let downstream code identify the content hash as wrong
    contentUri: ethers.utils.toUtf8String(res.contentURI, true)
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
 * @return [1, 3, 5]
 */
export function linspace(from: number, to: number, step = 1): number[] {
  const arr: number[] = [];
  for (let i = from; i <= to; i += step) arr.push(i);
  return arr;
}
