import "mocha";
import { expect } from "chai";
import { highestVersion } from "../../../src/utils/highestVersion.js";

describe("highestVersion", () => {
  it("should return the second version", () => {
    expect(highestVersion("", "1.4.2")).to.equal("1.4.2");
  });

  it("should return the first version", () => {
    expect(highestVersion("1.2.3", "")).to.equal("1.2.3");
  });

  it("should throw because no version is valid", () => {
    let error = "--- did not throw ---";
    try {
      highestVersion("", "");
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include("Comparing two undefined versions");
  });

  it("should return the latest (arg 1)", () => {
    expect(highestVersion("latest", "1.4.5")).to.equal("latest");
  });

  it("should return the latest (arg 2)", () => {
    expect(highestVersion("1.2.3", "latest")).to.equal("latest");
  });

  it("should throw because one version in not sematic", () => {
    let error = "--- did not throw ---";
    try {
      highestVersion("asffa", "1.4.2");
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include("Attempting to compare invalid versions");
  });

  it("should return the highest version", () => {
    expect(highestVersion("1.2.3", "1.4.2")).to.equal("1.4.2");
  });
});
