import "mocha";
import { expect } from "chai";
import { ManifestWithImage, Compose } from "../../../src/types";
import { mockManifestWithImage, mockCompose } from "../../testUtils";

import { manifestToCompose } from "../../../src/modules/manifest";
import { ComposeEditor } from "../../../src/modules/compose/editor";

describe("manifestToCompose", () => {
  const name = "mock-dnp.dappnode.eth";
  const version = "0.0.0";
  const ports = ["1111/1111", "1111/1111:udp"];
  const volumes = ["mockdnpdappnodeeth_data:/mock/mock/mock/"];
  const emptyImage = { hash: "mock", size: 0, path: "mock" };

  it("Should parse imageData from a manifest", () => {
    const manifest: ManifestWithImage = {
      name,
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
        [name]: {
          container_name: `DAppNodePackage-${name}`,
          image: `${name}:${version}`,
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
      name,
      version,
      image: emptyImage
    };

    const expectedCompose: Compose = {
      version: "3.4",
      services: {
        [name]: {
          container_name: `DAppNodePackage-${name}`,
          image: `${name}:${version}`
        }
      }
    };

    const composeObj = manifestToCompose(manifest);

    const compose = new ComposeEditor(composeObj);
    console.log(compose.dump());

    expect(composeObj).to.deep.equal(expectedCompose);
  });
});
