import { ethers } from "ethers";
import params from "../params";
import * as db from "../db";

export function getEthersProvider(): ethers.providers.JsonRpcProvider {
  const WEB3_HOST: string | undefined = params.WEB3_HOST;

  // Fetch a dynamic ethProvider from the DB
  const url = db.ethProvider.get() || WEB3_HOST;
  if (!url) throw Error("Empty ethProvider and WEB3_HOST");

  const provider = new ethers.providers.JsonRpcProvider(url);
  return provider;
}
