import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import params from "../../../src/params";

const apiCallMethod = "ipfsClientTargetSet";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should set the ipfs client target to local", async () => {
    const data = {
      ipfsRepository: {
        ipfsClientTarget: "local"
      }
    };
    url.searchParams.set("ipfsRepository", JSON.stringify(data.ipfsRepository));
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });

  it("Should set the ipfs client target to remote", async () => {
    const data = {
      ipfsRepository: {
        ipfsClientTarget: "remote",
        ipfsGateway: params.IPFS_REMOTE
      }
    };
    url.searchParams.set("ipfsRepository", JSON.stringify(data.ipfsRepository));
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
