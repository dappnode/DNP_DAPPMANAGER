import "mocha";
import { expect } from "chai";
import { Manifest } from "@dappnode/types";
import { parseMetadataFromManifest } from "../../../../src/modules/manifest/index.js";

describe("parseMetadataFromManifest", () => {
  it("Should parse metadata from a manifest", () => {
    const metadata: Manifest = {
      name: "mock-name",
      version: "0.0.0",
      description: "mock-description",
      type: "service",
      license: "MIT"
    };
    const emptyImage = { hash: "mock", size: 0, path: "mock" };

    // ##### Dangerously casting an incorrect manifest to check
    // ##### if it ignores the image field
    const manifest: Manifest = {
      image: emptyImage,
      ...metadata
    } as Manifest;

    expect(parseMetadataFromManifest(manifest)).to.deep.equal(metadata);
  });
});
