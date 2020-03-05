import { ethers } from "ethers";
import params from "../params";
import { getEthProviderUrl } from "../watchers/ethMultiClient";

export function getEthersProvider(): ethers.providers.JsonRpcProvider {
  const WEB3_HOST: string | undefined = params.WEB3_HOST;

  // Fetch a dynamic eth provider url from the client target in the DB
  const url = getEthProviderUrl() || WEB3_HOST;
  if (!url) throw Error("Empty ethProvider and WEB3_HOST");

  const provider = new ethers.providers.JsonRpcProvider(url);
  return provider;
}
