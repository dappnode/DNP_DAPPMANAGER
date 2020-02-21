import Web3 from "web3";
import { ApmVersion } from "../../../types";

interface ApmRepoVersionReturn {
  semanticVersion: number[]; // uint16[3]
  contractAddress: string; // address
  contentURI: string; // bytes
}

export default function parseResult(res: ApmRepoVersionReturn): ApmVersion {
  return {
    version: res.semanticVersion.join("."),
    contentUri: Web3.utils.hexToAscii(res.contentURI)
  };
}
