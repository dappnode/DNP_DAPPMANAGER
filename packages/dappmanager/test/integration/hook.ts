import { ipfs } from "../../src/modules/ipfs/index.js";
import { IpfsClientTarget } from "@dappnode/common";
import { setUpIpfsNode, setDownIpfsNode, ipfsApiUrl } from "./testIpfsUtils.js";

export const mochaHooks = {
  beforeAll: [
    async function (): Promise<void> {
      console.log("Setting up IPFS node...");
      await setUpIpfsNode();
      ipfs.changeHost(ipfsApiUrl, IpfsClientTarget.local);
    }
  ],
  afterAll: [
    async function (): Promise<void> {
      console.log("Setting down IPFS node");
      await setDownIpfsNode();
    }
  ]
};
