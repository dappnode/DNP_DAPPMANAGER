import "mocha";
import { expect } from "chai";
import rewiremock from "rewiremock/node.js";

describe.skip("getHostVolumeSizes", () => {
  async function getMock(shellHost: (cmd: string) => Promise<string>) {
    const mock = await rewiremock.around(
      () => import("../../src/getHostVolumeSizes.js"),
      (mock) => {
        mock(() => import("@dappnode/utils"))
          .with({ shellHost })
          .toBeUsed();
      }
    );
    return mock.getHostVolumeSizes;
  }

  it("Get the volume size of one volume", async () => {
    async function shellHost(cmd: string): Promise<string> {
      if (cmd.includes("/mnt/volume_ams3_01/dappnode-volumes"))
        return `
824204410	/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth/bitcoin_data
824208410	/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth
824212410	/mnt/volume_ams3_01/dappnode-volumes`;
      else throw Error(`Wrong path`);
    }

    const getHostVolumeSizes = await getMock(shellHost);

    const volName = "bitcoin_data";
    const volDevicePaths = {
      [volName]: "/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth/bitcoin_data"
    };
    const expectedVolSizes = {
      [volName]: "824204410"
    };

    const volSizes = await getHostVolumeSizes(volDevicePaths);

    expect(volSizes).to.deep.equal(expectedVolSizes);
  });
});
