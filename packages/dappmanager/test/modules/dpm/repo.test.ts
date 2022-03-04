import { expect } from "chai";
import {
  VersionSorting,
  sortLatestVersion
} from "../../../src/modules/dpm/repo";

describe("modules / dpm / repo / sortLatestVersion", () => {
  const testCases: {
    versions: string[];
    latest: string;
    sorting: VersionSorting;
  }[] = [
    // Regular semver versions
    {
      versions: ["1.1.4", "1.1.5", "2.0.0-beta.0", "2.0.0"],
      latest: "2.0.0",
      sorting: VersionSorting.semver
    },
    {
      versions: ["1.1.4", "1.1.5", "2.0.0-beta.0"],
      latest: "2.0.0-beta.0",
      sorting: VersionSorting.semver
    },
    {
      versions: ["2.0.0-beta.0", "2.0.0-beta.1"],
      latest: "2.0.0-beta.1",
      sorting: VersionSorting.semver
    },
    {
      versions: ["2.0.0-beta.0", "2.0.0-beta.0-0", "2.0.0-beta.0-1"],
      latest: "2.0.0-beta.0-1",
      sorting: VersionSorting.semver
    },
    {
      versions: ["2.0.0-beta.0", "2.0.0-beta.0-0", "2.0.0-beta.0-1"],
      latest: "2.0.0-beta.0-1",
      sorting: VersionSorting.semver
    },

    // date versions (erigon)
    {
      versions: ["2021.1.01-beta", "2021.2.01-beta", "2021.12.01-beta"],
      latest: "2021.12.01-beta",
      sorting: VersionSorting.semver
    },

    // partial semver (bitcoin)
    {
      versions: ["18.0", "19.0", "22.0"],
      latest: "22.0",
      sorting: VersionSorting.alphabetical
    },

    // release27932 (trustlines)
    {
      versions: ["release27370", "release27932"],
      latest: "release27932",
      sorting: VersionSorting.alphabetical
    },

    // (raiden-testnet)
    {
      versions: ["nightly-2019-09-03T00-27-50-v0.100.5a1.dev142"],
      latest: "nightly-2019-09-03T00-27-50-v0.100.5a1.dev142",
      sorting: VersionSorting.alphabetical
    }
  ];

  for (const { versions, latest, sorting } of testCases) {
    it(`${sorting} - ${JSON.stringify(versions)}`, () => {
      expect(sortLatestVersion(sorting, versions)).to.equal(latest);
    });
  }
});
