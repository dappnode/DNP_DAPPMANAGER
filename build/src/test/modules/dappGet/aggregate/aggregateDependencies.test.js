const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const semver = require("semver");
const sinon = require("sinon");

/**
 * Purpose of the test. Make sure it is able recursively fetch a DNP's dependencies
 *
 * Tested with two cases:
 * > Case 1: Basic request.
 *   Test basic functionality, make sure the output is formated correctly
 *   REQ: 'kovan.dnp.dappnode.eth'
 *   DEPS:
 *   - 'kovan.dnp.dappnode.eth' => 'dependency.dnp.dappnode.eth'
 *   - 'dependency.dnp.dappnode.eth' => []
 *
 * > Case 2: Circular dependencies.
 *   Test against circular dependencies to make sure it doesn't crash due to an infinite loop
 *   REQ: 'dnpA.dnp.dappnode.eth'
 *   DEPS:
 *   - 'dnpA.dnp.dappnode.eth' => 'dnpB.dnp.dappnode.eth'
 *   - 'dnpB.dnp.dappnode.eth' => 'dnpC.dnp.dappnode.eth'
 *   - 'dnpC.dnp.dappnode.eth' => 'dnpA.dnp.dappnode.eth'
 */

const aggregateDependencies = proxyquire(
  "modules/dappGet/aggregate/aggregateDependencies",
  {}
);

const fetchVersions = versions =>
  sinon.stub().callsFake(async ({ name, versionRange }) => {
    if (!versions[name]) throw Error(`No versions found for dnp: ${name}`);
    return versions[name].filter(version =>
      semver.satisfies(version, versionRange)
    );
  });

const fetchDependencies = dependencies =>
  sinon.stub().callsFake(async ({ name }) => {
    if (!dependencies[name])
      throw Error(`No dependencies found for dnp: ${name}`);
    return dependencies[name];
  });

describe("dappGet/aggregate/aggregateDependencies", () => {
  it("should fetch the correct dependencies", async () => {
    const versions = {
      "kovan.dnp.dappnode.eth": ["0.1.0", "0.1.1", "0.1.2", "0.2.0", "0.2.1"],
      "dependency.dnp.dappnode.eth": ["0.1.0", "0.1.1", "0.1.2", "0.2.0"]
    };

    const dependencies = {
      "kovan.dnp.dappnode.eth": {
        "dependency.dnp.dappnode.eth": "^0.1.1"
      },
      "dependency.dnp.dappnode.eth": {}
    };

    const fetch = {
      dependencies: fetchDependencies(dependencies),
      versions: fetchVersions(versions)
    };

    const name = "kovan.dnp.dappnode.eth";
    const versionRange = "0.1.0";
    const dnps = {};
    await aggregateDependencies({ name, versionRange, dnps, fetch });

    expect(dnps).to.deep.equal({
      "kovan.dnp.dappnode.eth": {
        versions: {
          "0.1.0": { "dependency.dnp.dappnode.eth": "^0.1.1" }
        }
      },
      "dependency.dnp.dappnode.eth": {
        versions: {
          "0.1.1": {},
          "0.1.2": {}
        }
      }
    });
  });

  it("should not crash with circular dependencies", async () => {
    const versions = {
      "dnpA.dnp.dappnode.eth": ["0.1.0"],
      "dnpB.dnp.dappnode.eth": ["0.1.0"],
      "dnpC.dnp.dappnode.eth": ["0.1.0"]
    };

    const dependencies = {
      "dnpA.dnp.dappnode.eth": { "dnpB.dnp.dappnode.eth": "^0.1.0" },
      "dnpB.dnp.dappnode.eth": { "dnpC.dnp.dappnode.eth": "^0.1.0" },
      "dnpC.dnp.dappnode.eth": { "dnpA.dnp.dappnode.eth": "^0.1.0" }
    };

    const fetch = {
      dependencies: fetchDependencies(dependencies),
      versions: fetchVersions(versions)
    };

    const name = "dnpA.dnp.dappnode.eth";
    const versionRange = "0.1.0";
    const dnps = {};
    await aggregateDependencies({ name, versionRange, dnps, fetch });

    expect(dnps).to.deep.equal({
      "dnpA.dnp.dappnode.eth": {
        versions: { "0.1.0": { "dnpB.dnp.dappnode.eth": "^0.1.0" } }
      },
      "dnpB.dnp.dappnode.eth": {
        versions: { "0.1.0": { "dnpC.dnp.dappnode.eth": "^0.1.0" } }
      },
      "dnpC.dnp.dappnode.eth": {
        versions: { "0.1.0": { "dnpA.dnp.dappnode.eth": "^0.1.0" } }
      }
    });
  });
});
