import web3 from "../../web3Setup";
import { isEnsDomain } from "../../../utils/validate";
import * as ensContract from "../../../contracts/ens";
import * as publicResolverContract from "../../../contracts/publicResolver";

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

export default async function fetchRepoAddress(
  repoName: string
): Promise<string> {
  // Validate the provided name, it only accepts .eth domains
  if (!isEnsDomain(repoName)) throw Error(`repoName must be an ENS domain`);

  const ens = new web3.eth.Contract(ensContract.abi, ensContract.address);
  const resolverAddress = await ens.methods.resolver(namehash(repoName)).call();

  if (resolverAddress == "0x0000000000000000000000000000000000000000") {
    throw Error(`No repo found for ${repoName}`);
  }

  const resolver = new web3.eth.Contract(
    publicResolverContract.abi,
    resolverAddress
  );
  const repoAddr: string = await resolver.methods
    .addr(namehash(repoName))
    .call();
  if (!repoAddr) throw Error(`Resolver could not find a match for ${repoName}`);

  return repoAddr;
}
