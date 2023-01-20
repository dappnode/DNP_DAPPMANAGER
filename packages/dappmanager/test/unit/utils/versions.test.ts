import "mocha";
import { expect } from "chai";

import * as versions from "../../../src/utils/versions.js";

describe("Util: versions", () => {
  describe(".isHigher", () => {
    it("should 0.0.0 > 0.0.1 = false", () => {
      expect(versions.isHigher("0.0.0", "0.0.1")).to.equal(false);
    });
    it("should 0.0.1 > 0.0.0 = true", () => {
      expect(versions.isHigher("0.0.1", "0.0.0")).to.equal(true);
    });
    it("should (undefined = latest = 9.9.9) > 0.0.0 = true", () => {
      expect(versions.isHigher("", "0.0.1")).to.equal(true);
    });
    it("should (undefined = latest = 9.9.9) > (undefined = latest = 9.9.9) = false", () => {
      expect(versions.isHigher("", "")).to.equal(false);
    });
  });

  describe(".highestVersion", () => {
    it("should return the second version", () => {
      expect(versions.highestVersion("", "1.4.2")).to.equal("1.4.2");
    });

    it("should return the first version", () => {
      expect(versions.highestVersion("1.2.3", "")).to.equal("1.2.3");
    });

    it("should throw because no version is valid", () => {
      let error = "--- did not throw ---";
      try {
        versions.highestVersion("", "");
      } catch (e) {
        error = e.message;
      }
      expect(error).to.include("Comparing two undefined versions");
    });

    it("should return the latest (arg 1)", () => {
      expect(versions.highestVersion("latest", "1.4.5")).to.equal("latest");
    });

    it("should return the latest (arg 2)", () => {
      expect(versions.highestVersion("1.2.3", "latest")).to.equal("latest");
    });

    it("should throw because one version in not sematic", () => {
      let error = "--- did not throw ---";
      try {
        versions.highestVersion("asffa", "1.4.2");
      } catch (e) {
        error = e.message;
      }
      expect(error).to.include("Attempting to compare invalid versions");
    });

    it("should return the highest version", () => {
      expect(versions.highestVersion("1.2.3", "1.4.2")).to.equal("1.4.2");
    });
  });
});
