import "mocha";
import { expect } from "chai";
import rewiremock from "rewiremock";
import { mockManifest, mockDirectoryDnp } from "../testUtils";
// Imports for typings
import fetchDirectoryType from "../../src/calls/fetchDirectory";
import { Manifest, DirectoryDnp } from "../../src/types";

describe("Call function: fetchDirectory", function() {
  // This function gets the manifest of a package,
  // and then gets the avatar refered in the manifest if any
  // Finally returns this data objectified
  const avatarHash = "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt";
  const avatarContent = "base64-avatar-mockmockmockmock";
  const manifest = { ...mockManifest, avatar: avatarHash };

  describe("Call function fetchDirectory", function() {
    let fetchDirectory: typeof fetchDirectoryType;

    before("Mock", async () => {
      async function getDirectory(): Promise<DirectoryDnp[]> {
        return [mockDirectoryDnp];
      }

      async function getManifest(): Promise<Manifest> {
        return manifest;
      }

      async function getAvatar(hash: string): Promise<string> {
        if (hash === avatarHash) return avatarContent;
        throw Error(`Unknown avatar hash ${hash}`);
      }

      async function isSyncing(): Promise<boolean> {
        return false;
      }

      const mock = await rewiremock.around(
        () => import("../../src/calls/fetchDirectory"),
        mock => {
          mock(() => import("../../src/modules/release/getDirectory"))
            .withDefault(getDirectory)
            .toBeUsed();
          mock(() => import("../../src/modules/release/getManifest"))
            .withDefault(getManifest)
            .toBeUsed();
          mock(() => import("../../src/modules/release/getAvatar"))
            .withDefault(getAvatar)
            .toBeUsed();
          mock(() => import("../../src/utils/isSyncing"))
            .withDefault(isSyncing)
            .toBeUsed();
        }
      );
      fetchDirectory = mock.default;
    });

    it("should return success message and the directory data", async () => {
      const expectedDirectoryReturn: DirectoryDnp[] = [
        {
          ...mockDirectoryDnp,
          manifest,
          avatar: avatarContent
        }
      ];

      const res = await fetchDirectory();
      expect(res).to.be.ok;
      expect(res).to.have.property("message");
      expect(res).to.have.property("result");
      expect(res.result).to.be.an("array");
      expect(res.result).to.deep.equal(expectedDirectoryReturn);
    });
  });
});
