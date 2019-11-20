import "mocha";
import { expect } from "chai";
import path from "path";
import fs from "fs";
import {
  validateImage,
  validateManifestBasic,
  validateComposeOrUnsafe,
  validateManifestWithImage
} from "../../../../src/modules/release/parsers/validate";
import {
  testDir,
  createTestDir,
  cleanTestDir,
  mockManifest,
  mockCompose,
  mockManifestWithImage
} from "../../../testUtils";
import {
  Manifest,
  ManifestWithImage,
  ComposeUnsafe
} from "../../../../src/types";

describe("Release > validate", () => {
  describe("validateImage", () => {
    before(async () => {
      await createTestDir();
    });

    const validXzFile = Buffer.from(
      "/Td6WFoAAATm1rRGAgAhARYAAAB0L+WjAQABMQoAAADlT7krPwkQdQABGgLcLqV+H7bzfQEAAAAABFla",
      "base64"
    );

    it("Should validate a .tar.xz file", async () => {
      const imagePath = path.join(testDir, "test-valid-xz-file.xz");
      fs.writeFileSync(imagePath, validXzFile);
      await validateImage(imagePath);
    });

    it("Should reject a missing file", async () => {
      const imagePath = path.join(testDir, "missing-file");
      try {
        await validateImage(imagePath);
        throw Error("function did not throw");
      } catch (e) {
        expect(e.message).to.include("File not found");
      }
    });

    it("Should reject an empty file", async () => {
      const imagePath = path.join(testDir, "test-empty-file.xz");
      fs.writeFileSync(imagePath, "");
      try {
        await validateImage(imagePath);
        throw Error("function did not throw");
      } catch (e) {
        expect(e.message).to.include("File size is 0 bytes");
      }
    });

    it("Should reject a non-xz file", async () => {
      const imagePath = path.join(testDir, "test-broken-xz-file.xz");
      fs.writeFileSync(imagePath, validXzFile + "asdububiuqbw");
      try {
        await validateImage(imagePath);
        throw Error("function did not throw");
      } catch (e) {
        expect(e.message).to.include(
          `Invalid .xz: Command failed: xz -t ${imagePath}\nxz: ${imagePath}: File format not recognized\n`
        );
      }
    });

    after(async () => {
      await cleanTestDir();
    });
  });

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
        extraProp: true
      } as ManifestWithImage;
      expect(validateManifestWithImage(manifest)).to.deep.equal(manifest);
    });
  });

  describe("validateCompose", () => {
    it("Should validate a valid compose", () => {
      const compose = mockCompose;
      expect(validateComposeOrUnsafe(compose)).to.deep.equal(compose);
    });

    it("Should reject an empty compose", () => {
      expect(function() {
        validateComposeOrUnsafe({} as ComposeUnsafe);
      }).to.throw("Invalid compose");
    });

    it("Should validate a compose with unknown extra props", () => {
      const compose = { ...mockCompose, extraProp: true } as ComposeUnsafe;
      expect(validateComposeOrUnsafe(compose)).to.deep.equal(compose);
    });
  });
});
