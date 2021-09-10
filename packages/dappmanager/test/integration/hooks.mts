import { setUpIpfsNode, setDownIpfsNode } from "../testIpfsUtils";

export const mochaHooks = {
  async beforeAll(): Promise<void> {
    await setUpIpfsNode();
  },

  async afterAll(): Promise<void> {
    await setDownIpfsNode();
  }
};
