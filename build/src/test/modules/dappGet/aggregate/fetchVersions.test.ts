import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { ApmVersion } from "../../../../src/types";
import rewiremock from "rewiremock";
// Import for types
import fetchVersionType from "../../../../src/modules/dappGet/fetch/fetchVersions";

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

async function getLatestVersion(): Promise<ApmVersion> {
  return { version: "0.1.2", contentUri };
}

const getAllVersionsSpy = sinon.spy();
async function getAllVersions(): Promise<ApmVersion[]> {
  getAllVersionsSpy();
  return [
    { version: "0.1.2", contentUri },
    { version: "0.1.1", contentUri },
    { version: "0.1.0", contentUri }
  ];
}

describe("dappGet/fetch/fetchVersions", () => {
  let fetchVersions: typeof fetchVersionType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../../../src/modules/dappGet/fetch/fetchVersions"),
      mock => {
        mock(() => import("../../../../src/modules/release/getVersions"))
          .with({ getLatestVersion, getAllVersions })
          .toBeUsed();
      }
    );
    fetchVersions = mock.default;
  });

  it("Should call APM given a valid semver range", async () => {
    const versions = await fetchVersions("kovan.dnp.dappnode.eth", "^0.1.0");
    sinon.assert.callCount(getAllVersionsSpy, 1);
    expect(versions).to.deep.equal(expectedApmVersionsReturn);
  });

  it("Should call return that version with a valid semver version", async () => {
    const semverVersion = "0.1.0";
    const versions = await fetchVersions(
      "kovan.dnp.dappnode.eth",
      semverVersion
    );
    expect(versions).to.deep.equal([semverVersion]);
  });

  it("Should call return that single version given an invalid semver version", async () => {
    const ipfsHash = "/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws";
    const versions = await fetchVersions("kovan.dnp.dappnode.eth", ipfsHash);
    expect(versions).to.deep.equal([ipfsHash]);
  });
});
