import { dappnodeInstaller } from "../testUtils.js";
import { setUpIpfsNode, setDownIpfsNode, ipfsApiUrl } from "./testIpfsUtils.js";

export const mochaHooks = {
  beforeAll: [
    async function (): Promise<void> {
      console.log("Setting up IPFS node...");
      await setUpIpfsNode();
      dappnodeInstaller.changeIpfsProvider(ipfsApiUrl);
    }
  ],
  afterAll: [
    async function (): Promise<void> {
      console.log("Setting down IPFS node");
      await setDownIpfsNode();
    }
  ]
};
