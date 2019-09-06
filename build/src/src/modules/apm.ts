import semver from "semver";
import * as validate from "../utils/validate";
import web3 from "./web3Setup";
import { PackageRequest } from "../types";

import * as ensContract from "../contracts/ens";
import * as publicResolverContract from "../contracts/publicResolver";
import * as repoContract from "../contracts/repository";
import Logs from "../logs";
const logs = Logs(module);

function namehash(name: string): string {
  let node =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (name != "") {
    const labels = name.split(".");
    for (let i = labels.length - 1; i >= 0; i--) {
      node = web3.utils.sha3(node + web3.utils.sha3(labels[i]).slice(2));
    }
  }
  return node.toString();
}

// Declare utility methods
export async function getRepoAddress(reponame: string): Promise<string> {
  const ens = new web3.eth.Contract(ensContract.abi, ensContract.address);
  const resolverAddress = await ens.methods.resolver(namehash(reponame)).call();

  if (resolverAddress == "0x0000000000000000000000000000000000000000") {
    return "";
  }

  const resolver = new web3.eth.Contract(
    publicResolverContract.abi,
    resolverAddress
  );
  return await resolver.methods.addr(namehash(reponame)).call();
}

export async function getSemanticVersion(
  repoAddr: string,
  version: string[]
): Promise<string> {
  const repo = new web3.eth.Contract(repoContract.abi, repoAddr);
  return await repo.methods
    .getBySemanticVersion(version)
    .call()
    .then((res: { contentURI: string }) =>
      web3.utils.hexToAscii(res.contentURI)
    )
    .catch((err: Error) => {
      if (err.message == "Couldn't decode uint16 from ABI: 0x")
        return "NOT_VALID_VERSION";
      else throw err;
    });
}

// Declare methods

// Util to check if a repo exists for a given name
export async function repoExists(reponame: string): Promise<boolean> {
  const ens = new web3.eth.Contract(ensContract.abi, ensContract.address);
  const resolverAddress = await ens.methods.resolver(namehash(reponame)).call();
  return resolverAddress !== "0x0000000000000000000000000000000000000000";
}

export const getRepoHash = async (
  packageReq: PackageRequest
): Promise<string> => {
  const name = packageReq.name;
  const version = packageReq.ver;
  validate.isEthDomain(name); // Validate the provided name, it only accepts .eth domains

  const repoAddr = await getRepoAddress(name);
  if (!repoAddr) {
    throw Error(`Resolver could not find a match for ${name}`);
  }

  const cleanVersion = semver.valid(version) ? semver.clean(version) : null;
  if (cleanVersion) {
    // Getting the specific version provided
    const versionArray = cleanVersion.split(".");
    return getSemanticVersion(repoAddr, versionArray);
  } else {
    const repo = new web3.eth.Contract(repoContract.abi, repoAddr);
    return await repo.methods
      .getLatest()
      .call()
      .then((res: { contentURI: string }) =>
        web3.utils.hexToAscii(res.contentURI)
      );
  }
};

/**
 * Versions
 *
 * @param {*} packageReq
 * @returns {*}
 */
export async function getLatestWithVersion(
  packageReq: PackageRequest
): Promise<{ [version: string]: string }> {
  if (!packageReq || typeof packageReq !== "object") {
    throw Error("Wrong packageReq: " + packageReq);
  }
  if (!packageReq.name) {
    throw Error("packageReq must contain a name property: " + packageReq);
  }

  const { name } = packageReq;
  validate.isEthDomain(name); // Validate the provided name, it only accepts .eth domains

  const repoAddr = await getRepoAddress(name);
  const repo = new web3.eth.Contract(repoContract.abi, repoAddr);
  if (!repo) {
    throw Error(`Resolver could not find a match for ${name}`);
  }

  const versionCount = parseFloat(await repo.methods.getVersionsCount().call());
  const versions: { [version: string]: string } = {};
  // versionIndexes = [1, 2, 3, 4, 5, ...]

  /**
   * Versions called by id are ordered in ascending order.
   * The min version = 1 and the latest = versionCount
   *
   *  i | semanticVersion
   * ---|------------------
   *  1 | [ '0', '0', '1' ]
   *  2 | [ '0', '0', '2' ]
   *  3 | [ '0', '0', '3' ]
   *  4 | [ '0', '0', '4' ]
   */
  try {
    const { semanticVersion } = await repo.methods
      .getByVersionId(versionCount)
      .call();
    // semanticVersion = [1, 0, 8]. It is joined to form a regular semver string
    // Append version result to the versions object
    versions[semanticVersion.join(".")] = await getSemanticVersion(
      repoAddr,
      semanticVersion
    );
  } catch (e) {
    // If you request an inexistent ID to the contract, web3 will throw
    // Error: couldn't decode uint16 from ABI. The try, catch block will catch that
    // and log other errors
    if (e.message.includes("decode uint16 from ABI")) {
      logs.error("Attempting to fetch an inexistent version");
    } else {
      logs.error(`Error getting latest version of ${name}: ${e.stack}`);
    }
  }
  return versions;
}

/**
 * Versions
 *
 * @param {*} packageReq
 * @param {*} verReq
 * @returns {*}
 */
export async function getRepoVersions(
  packageReq: PackageRequest,
  verReq: string
): Promise<{ [version: string]: string }> {
  if (!packageReq || typeof packageReq !== "object") {
    throw Error("Wrong packageReq: " + packageReq);
  }
  if (!packageReq.name) {
    throw Error("packageReq must contain a name property: " + packageReq);
  }
  // If verReq is not provided or invalid, default to all versions
  if (!verReq || semver.validRange(verReq)) {
    verReq = "*";
  }

  const { name } = packageReq;
  validate.isEthDomain(name); // Validate the provided name, it only accepts .eth domains

  const repoAddr = await getRepoAddress(name);
  if (!repoAddr) throw Error(`Resolver could not find a match for ${name}`);
  const repo = new web3.eth.Contract(repoContract.abi, repoAddr);

  const versionCount = parseFloat(await repo.methods.getVersionsCount().call());
  const versions: { [version: string]: string } = {};
  // versionIndexes = [1, 2, 3, 4, 5, ...]
  const versionIndexes = [...Array(versionCount).keys()].map(i => i + 1);

  /**
   * Versions called by id are ordered in ascending order.
   * The min version = 1 and the latest = versionCount
   *
   *  i | semanticVersion
   * ---|------------------
   *  1 | [ '0', '0', '1' ]
   *  2 | [ '0', '0', '2' ]
   *  3 | [ '0', '0', '3' ]
   *  4 | [ '0', '0', '4' ]
   */
  await Promise.all(
    versionIndexes.map(async i => {
      try {
        const verArray = (await repo.methods.getByVersionId(i).call())
          .semanticVersion;
        // semanticVersion = [1, 0, 8]. It is joined to form a regular semver string
        const ver = verArray.join(".");
        // Append version result to the versions object
        if (semver.satisfies(ver, verReq)) {
          versions[ver] = await getSemanticVersion(repoAddr, verArray);
        }
      } catch (e) {
        // If you request an inexistent ID to the contract, web3 will throw
        // Error: couldn't decode uint16 from ABI. The try, catch block will catch that
        // and log other errors
        if (e.message.includes("decode uint16 from ABI")) {
          logs.error("Attempting to fetch an inexistent version");
        } else {
          logs.error(`Error getting versions of ${name}: ${e.stack}`);
        }
      }
    })
  );

  return versions;
}

/**
 * Fetches the latest version of a DNP
 * @param {object} packageReq { name: "bitcoin.dnp.dappnode.eth" }
 * @returns {string} latestVersion = "0.2.4"
 */
export async function getLatestSemver(
  packageReq: PackageRequest
): Promise<string> {
  if (!packageReq || typeof packageReq !== "object") {
    throw Error("Wrong packageReq: " + packageReq);
  }
  if (!packageReq.name) {
    throw Error("packageReq must contain a name property: " + packageReq);
  }

  const { name } = packageReq;
  validate.isEthDomain(name); // Validate the provided name, it only accepts .eth domains

  const repoAddr = await getRepoAddress(name);
  if (!repoAddr) throw Error(`Resolver could not find a match for ${name}`);
  const repo = new web3.eth.Contract(repoContract.abi, repoAddr);

  const res = await repo.methods.getLatest().call();
  return res.semanticVersion.join(".");
}
