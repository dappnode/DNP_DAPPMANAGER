const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const sinon = require("sinon");

/**
 * Purpose of the test. Make sure it returns the correct array of versions
 * dependening on the type of versionRange
 *
 * > Should call APM given a valid semver range
 * > Should call return that version with a valid semver version
 * > Should call return that single version given an invalid semver version
 */

const apmVersionRange = ["0.1.0", "0.1.1", "0.1.2"];
const apm = {
  getRepoVersions: sinon.stub().callsFake(async () => {
    return { "0.1.0": "", "0.1.1": "", "0.1.2": "" };
  })
};

const fetchVersions = proxyquire("modules/dappGet/fetch/fetchVersions", {
  "modules/apm": apm
});

describe("dappGet/fetch/fetchVersions", () => {
  it("Should call APM given a valid semver range", async () => {
    const versions = await fetchVersions({
      name: "kovan.dnp.dappnode.eth",
      versionRange: "^0.1.0"
    });
    sinon.assert.callCount(apm.getRepoVersions, 1);
    expect(versions).to.deep.equal(apmVersionRange);
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
