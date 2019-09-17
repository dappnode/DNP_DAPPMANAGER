import web3 from "../../web3Setup";
import { ApmVersion } from "../../../types";
import * as repoContract from "../../../contracts/repository";
import fetchRepoAddress from "./fetchRepoAddress";
import parseResult from "./parseResult";

/**
 * Fetches the latest version of a DNP
 * @param {object} packageReq { name: "bitcoin.dnp.dappnode.eth" }
 * @returns {string} latestVersion = "0.2.4"
 */
export default async function fetchLatestVersion(
  name: string
): Promise<ApmVersion> {
  const repoAddr = await fetchRepoAddress(name);
  const repo = new web3.eth.Contract(repoContract.abi, repoAddr);

  const res = await repo.methods.getLatest().call();
  return parseResult(res);
}
