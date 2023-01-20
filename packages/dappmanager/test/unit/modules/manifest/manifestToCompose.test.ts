import "mocha";
import { expect } from "chai";
import { ManifestWithImage } from "../../../../src/types.js";
import { Compose } from "@dappnode/dappnodesdk";
import { mockManifestWithImage, mockCompose } from "../../../testUtils.js";
import { manifestToCompose } from "../../../../src/modules/manifest/index.js";
import { ComposeEditor } from "../../../../src/modules/compose/editor.js";

describe("manifestToCompose", () => {
  const dnpName = "mock-dnp.dappnode.eth";
  const version = "0.0.0";
  const ports = ["1111/1111", "1111/1111:udp"];
  const volumes = ["mockdnpdappnodeeth_data:/mock/mock/mock/"];
  const emptyImage = { hash: "mock", size: 0, path: "mock" };

  it("Should parse imageData from a manifest", () => {
    const manifest: ManifestWithImage = {
      name: dnpName,
      version,
      image: {
        ...mockManifestWithImage.image,
        ports,
        volumes
      }
    };

    const expectedCompose: Compose = {
      ...mockCompose,
      services: {
        [dnpName]: {
          container_name: `DAppNodePackage-${dnpName}`,
          image: `${dnpName}:${version}`,
          ports,
          volumes
        }
      },
      volumes: {
        mockdnpdappnodeeth_data: {}
      }
    };
    expect(manifestToCompose(manifest)).to.deep.equal(expectedCompose);
  });

  it("Should parse imageData from a manifest without data", () => {
    const manifest: ManifestWithImage = {
      name: dnpName,
      version,
      image: emptyImage
    };

    const expectedCompose: Compose = {
      version: "3.5",
      services: {
        [dnpName]: {
          container_name: `DAppNodePackage-${dnpName}`,
          image: `${dnpName}:${version}`
        }
      }
    };

    const composeObj = manifestToCompose(manifest);

    const compose = new ComposeEditor(composeObj);
    console.log(compose.dump());

    expect(composeObj).to.deep.equal(expectedCompose);
  });
});
