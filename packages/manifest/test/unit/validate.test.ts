import "mocha";
import { expect } from "chai";
import { mockManifest } from "../testUtils.js";
import { Manifest } from "@dappnode/types";
import { validateManifestBasic } from "../../src/index.js";

describe("validateManifestBasic", () => {
  it("Should validate a valid manifest", () => {
    const manifest = mockManifest;
    expect(validateManifestBasic(manifest)).to.deep.equal(manifest);
  });

  it("Should reject an empty manifest", () => {
    expect(function() {
      validateManifestBasic({} as Manifest);
    }).to.throw("Invalid manifest");
  });

  it("Should validate a manifest with unknown extra props", () => {
    const manifest = { ...mockManifest, extraProp: true } as Manifest;
    expect(validateManifestBasic(manifest)).to.deep.equal(manifest);
  });
});
