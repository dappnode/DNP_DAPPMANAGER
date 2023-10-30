import "mocha";
import { expect } from "chai";
import { mockManifest, mockManifestWithImage } from "../testUtils.js";
import { ManifestWithImage } from "@dappnode/common";
import { Manifest } from "@dappnode/types";
import {
  validateManifestBasic,
  validateManifestWithImage,
} from "../../src/index.js";

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

describe("validateManifestWithImage", () => {
  it("Should validate a valid manifest", () => {
    const manifest = mockManifestWithImage;
    expect(validateManifestWithImage(manifest)).to.deep.equal(manifest);
  });

  it("Should reject an empty manifest", () => {
    expect(function() {
      validateManifestWithImage({} as ManifestWithImage);
    }).to.throw("Invalid manifest");
  });

  it("Should validate a manifest with unknown extra props", () => {
    const manifest = {
      ...mockManifestWithImage,
      extraProp: true,
    } as ManifestWithImage;
    expect(validateManifestWithImage(manifest)).to.deep.equal(manifest);
  });
});
