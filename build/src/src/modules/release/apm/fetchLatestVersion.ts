import { getEthersProvider } from "../../ethProvider";
import { ethers } from "ethers";
import { ApmVersion } from "../../../types";
import * as repoContract from "../../../contracts/repository";
import { parseApmVersionReturn } from "./apmUtils";

/**
 * Fetch the latest version of an APM repo
 * @param name "bitcoin.dnp.dappnode.eth"
 */
export default async function fetchLatestVersion(
  name: string
): Promise<ApmVersion> {
  const provider = getEthersProvider();
  const repo = new ethers.Contract(name, repoContract.abi, provider);

  return await repo.getLatest().then(parseApmVersionReturn);
}
