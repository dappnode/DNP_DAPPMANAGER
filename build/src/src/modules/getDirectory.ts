import isEnsDomain from "../utils/isEnsDomain";
import { DirectoryDnp, DirectoryDnpStatus } from "../types";
import * as directoryContract from "../contracts/directory";
import web3 from "./web3Setup";
import Logs from "../logs";
const logs = Logs(module);

// Contract parameters
const DAppNodePackageStatus: DirectoryDnpStatus[] = [
  "Deleted",
  "Active",
  "Developing"
];

/**
 * Fetches all package names in the custom dappnode directory.
 *
 * @returns {array} An array of objects:
 *  [
 *    {
 *      name: packageName,   {string}
 *      status: 1            {number}
 *      statusName: "Active" {string}
 *      position: 2000,      {number}
 *      directoryId: 3       {number}
 *    },
 *    ...
 *  ]
 */
export default async function getDirectory(): Promise<DirectoryDnp[]> {
  const directory = new web3.eth.Contract(
    directoryContract.abi,
    directoryContract.address
  );
  const numberOfDAppNodePackages = parseInt(
    await directory.methods.numberOfDAppNodePackages().call()
  );

  // Get featured packages list
  // 0x0b00000000000000000000000000000000000000000000000000000000000000
  const featuredBytes = await directory.methods.featured().call();
  // ["0b", "00", ...]
  /**
   * 1. Strip hex prefix
   * 2. Split by substrings of 2 characters
   * 3. Remove 0 indexes
   * 4. Remove duplicate indexes
   * 5. Base64 to decimal index
   */
  const featuredIndexes = featuredBytes
    .replace("0x", "")
    .match(/.{1,2}/g)
    .filter((value: string) => value !== "00")
    .filter(
      (value: string, index: number, self: string[]) =>
        self.indexOf(value) === index
    )
    .map((base64: string) => parseInt(base64, 16));

  const directoryIds = [];
  for (let i = 0; i < numberOfDAppNodePackages; i++) {
    directoryIds.push(i);
  }

  const packages: DirectoryDnp[] = [];
  await Promise.all(
    directoryIds.map(async i => {
      try {
        const {
          name,
          status: statusBn,
          position: positionBn
        } = await directory.methods.getPackage(i).call();

        const status = parseInt(statusBn);
        const position = parseInt(positionBn);

        // Make sure the DNP is not Deprecated or Deleted
        if (!isEnsDomain(name) || status === 0) return;

        const featuredIndex = featuredIndexes.indexOf(i);
        const pkg: DirectoryDnp = {
          name,
          status,
          statusName: DAppNodePackageStatus[status],
          position,
          directoryId: i,
          isFeatured: featuredIndex > -1,
          featuredIndex: featuredIndex
        };

        packages.push(pkg);
      } catch (e) {
        logs.error(`Error retrieving DNP #${i} from directory: ${e.stack}`);
      }
    })
  );

  return packages;
}
