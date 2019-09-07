import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { ApmVersion } from "../../../../src/types";
const proxyquire = require("proxyquire").noCallThru();

/**
 * Purpose of the test. Make sure it returns the correct array of versions
 * dependening on the type of versionRange
 *
 * > Should call APM given a valid semver range
 * > Should call return that version with a valid semver version
 * > Should call return that single version given an invalid semver version
 */

const contentUri = "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt";
const expectedApmVersionsReturn = ["0.1.2", "0.1.1", "0.1.0"];
const getLatestVersion = sinon.stub().callsFake(
  async (): Promise<ApmVersion> => {
    return { version: "0.1.2", contentUri };
  }
);
const getAllVersions = sinon.stub().callsFake(
  async (): Promise<ApmVersion[]> => {
    return [
      { version: "0.1.2", contentUri },
      { version: "0.1.1", contentUri },
      { version: "0.1.0", contentUri }
    ];
  }
);

const { default: fetchVersions } = proxyquire(
  "../../../../src/modules/dappGet/fetch/fetchVersions",
  {
    "../../release/getVersions": { getLatestVersion, getAllVersions }
  }
);

describe("dappGet/fetch/fetchVersions", () => {
  it("Should call APM given a valid semver range", async () => {
    const versions = await fetchVersions({
      name: "kovan.dnp.dappnode.eth",
      versionRange: "^0.1.0"
    });
    sinon.assert.callCount(getAllVersions, 1);
    expect(versions).to.deep.equal(expectedApmVersionsReturn);
  });

  it("Should call return that version with a valid semver version", async () => {
    const semverVersion = "0.1.0";
    const versions = await fetchVersions({
      name: "kovan.dnp.dappnode.eth",
      versionRange: semverVersion
    });
    expect(versions).to.deep.equal([semverVersion]);
  });

  it("Should call return that single version given an invalid semver version", async () => {
    const ipfsHash = "/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws";
    const versions = await fetchVersions({
      name: "kovan.dnp.dappnode.eth",
      versionRange: ipfsHash
    });
    expect(versions).to.deep.equal([ipfsHash]);
  });
});
