import "mocha";
import { expect } from "chai";
import path from "path";
import fs from "fs";
import {
  validateAvatar,
  validateImage,
  validateManifestBasic,
  validateComposeOrUnsafe
} from "../../../src/modules/release/validate";
import {
  testDir,
  createTestDir,
  cleanTestDir,
  mockManifest,
  mockCompose
} from "../../testUtils";
import { Manifest, Compose } from "../../../src/types";

const successReturn = {
  success: true,
  message: ""
};

const errorReturnNoMessage = {
  success: false
};

const errorReturn = (
  message: string
): { success: boolean; message: string } => ({
  ...errorReturnNoMessage,
  message
});

describe("Release > validate", () => {
  describe("validateAvatar", () => {
    it("Should validate a valid avatar", () => {
      const avatarString =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEs";
      expect(validateAvatar(avatarString)).to.deep.equal(successReturn);
    });

    it("Should NOT validate a INvalid avatar", () => {
      const avatarString = '{"name":"mockname","version":"0.0.0"}';
      expect(validateAvatar(avatarString)).to.deep.equal(
        errorReturn('"avatar" must be a valid dataUri string')
      );
    });
  });

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
      expect(await validateImage(imagePath)).to.deep.equal(successReturn);
    });

    it("Should reject a missing file", async () => {
      const imagePath = path.join(testDir, "missing-file");
      expect(await validateImage(imagePath)).to.deep.equal(
        errorReturn("File not found")
      );
    });

    it("Should reject an empty file", async () => {
      const imagePath = path.join(testDir, "test-empty-file.xz");
      fs.writeFileSync(imagePath, "");
      expect(await validateImage(imagePath)).to.deep.equal({
        success: false,
        message: "File size is 0 bytes"
      });
    });

    it("Should reject a non-xz file", async () => {
      const imagePath = path.join(testDir, "test-broken-xz-file.xz");
      fs.writeFileSync(imagePath, validXzFile + "asdububiuqbw");
      expect(await validateImage(imagePath)).to.deep.equal(
        errorReturn(
          `Invalid .xz: Command failed: xz -t ${imagePath}\nxz: ${imagePath}: File format not recognized\n`
        )
      );
    });

    after(async () => {
      await cleanTestDir();
    });
  });

  describe("validateManifestBasic", () => {
    it("Should validate a valid manifest", () => {
      expect(validateManifestBasic(mockManifest)).to.deep.equal(successReturn);
    });

    it("Should reject an empty manifest", () => {
      expect(validateManifestBasic({} as Manifest)).to.deep.include(
        errorReturnNoMessage
      );
    });

    it("Should validate a manifest with unknown extra props", () => {
      expect(
        validateManifestBasic({ ...mockManifest, extraProp: true } as Manifest)
      ).to.deep.include(successReturn);
    });
  });

  describe("validateManifestWithImageData", () => {
    it("Should validate a valid manifest", () => {
      expect(validateManifestBasic(mockManifest)).to.deep.equal(successReturn);
    });

    it("Should reject an empty manifest", () => {
      expect(validateManifestBasic({} as Manifest)).to.deep.include(
        errorReturnNoMessage
      );
    });

    it("Should validate a manifest with unknown extra props", () => {
      expect(
        validateManifestBasic({ ...mockManifest, extraProp: true } as Manifest)
      ).to.deep.include(successReturn);
    });
  });

  describe("validateCompose", () => {
    it("Should validate a valid compose", () => {
      expect(validateComposeOrUnsafe(mockCompose)).to.deep.equal(successReturn);
    });

    it("Should reject an empty compose", () => {
      expect(validateComposeOrUnsafe({} as Compose)).to.deep.include(
        errorReturnNoMessage
      );
    });

    it("Should validate a compose with unknown extra props", () => {
      expect(
        validateComposeOrUnsafe({ ...mockCompose, extraProp: true } as Compose)
      ).to.deep.include(successReturn);
    });
  });
});
