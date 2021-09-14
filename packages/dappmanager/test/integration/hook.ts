import { setUpIpfsNode, setDownIpfsNode } from "../testIpfsUtils";

export const mochaHooks = {
  beforeAll: [
    async function (): Promise<void> {
      console.log("Setting up IPFS node...");
      await setUpIpfsNode();
    }
  ],
  afterAll: [
    async function (): Promise<void> {
      console.log("Setting down IPFS node");
      await setDownIpfsNode();
    }
  ]
};
