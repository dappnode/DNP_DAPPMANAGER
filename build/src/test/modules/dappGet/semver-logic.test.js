const semver = require("semver");
const expect = require("chai").expect;

/* eslint-disable no-console */

/**
 * The goal of this test is to verify the logic of semver with non-standard versions
 */

// semver.valid('1.2.3') // '1.2.3'
// semver.valid('a.b.c') // null
// semver.clean('  =v1.2.3   ') // '1.2.3'
// semver.satisfies('1.2.3', '1.x || >=2.5.0 || 5.0.0 - 7.2.3') // true
// semver.gt('1.2.3', '9.8.7') // false
// semver.lt('1.2.3', '9.8.7') // true
// semver.valid(semver.coerce('v2')) // '2.0.0'
// semver.valid(semver.coerce('42.6.7.9.3-alpha')) // '42.6.7'

describe("semver-logic", () => {
  it("valid versions", async () => {
    const versions = {
      "1.2.3": true,
      "1.2.3-ipfs-QmSxVWCqDpbq6Bb1nxjFBNNSKPHnbkAR5X3vAaXd98SEgC": true,
      "1.2.3-ipfs/QmSxVWCqDpbq6Bb1nxjFBNNSKPHnbkAR5X3vAaXd98SEgC": false
    };
    Object.keys(versions).forEach(version => {
      expect(Boolean(semver.valid(version))).to.equal(
        versions[version],
        `Version ${version} should ${versions[version] ? "be" : "NOT be"} valid`
      );
    });
  });

  it("satisfy 1.2.3", async () => {
    const versions = {
      "1.2.3": true,
      "1.2.3-alpha.3": true
    };
    const ranges = {
      "1.2.3-alpha.0": true,
      "1.2.3-alpha.3": true,
      "1.2.3": true,
      "^1.2.3": true,
      "^1.2.0": true,
      "^1.0.0": true,
      "^2.0.0": true
    };
    for (const range of Object.keys(ranges)) {
      for (const version of Object.keys(versions)) {
        console.log(
          `[version]  ${version}  [range]  ${range}  => ${Boolean(
            semver.satisfies(version, range)
          )}`
        );
      }
    }
    // Object.keys(versions).forEach((version) => {
    //     expect().to.equal(versions[version], `Version ${version} should ${versions[version] ? 'be' : 'NOT be'} valid`);
    // });
  });

  it("gt lt", async () => {
    const versions = {
      "1.2.3": true,
      "1.2.3-alpha.3": true
    };
    const versions2 = {
      "1.2.3": true,
      "1.2.3-alpha.3": true
    };
    for (const version2 of Object.keys(versions2)) {
      for (const version of Object.keys(versions)) {
        console.log(
          `${version}  gt  ${version2}  =>  ${Boolean(
            semver.gt(version, version2)
          )}`
        );
        console.log(
          `${version}  lt  ${version2}  =>  ${Boolean(
            semver.lt(version, version2)
          )}`
        );
      }
    }
    // Object.keys(versions).forEach((version) => {
    //     expect().to.equal(versions[version], `Version ${version} should ${versions[version] ? 'be' : 'NOT be'} valid`);
    // });
  });
});
