import "mocha";
import { expect } from "chai";
import {
  manifestToCompose,
  parseMetadataFromManifest,
  sanitizeCompose
} from "../../../src/modules/release/parsers";
import { mockManifestWithImage, mockCompose } from "../../testUtils";
import { ManifestWithImage, Manifest, Compose } from "../../../src/types";

/* eslint-disable @typescript-eslint/camelcase */
describe("Release > parsers", () => {
  const ports = ["1111/1111", "1111/1111:udp"];
  const volumes = ["mockdnpdappnodeeth_data:/mock/mock/mock/"];
  const emptyImage = { hash: "mock", size: 0, path: "mock" };

  describe("manifestToCompose", () => {
    const name = "mock-dnp.dappnode.eth";
    const version = "0.0.0";

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
            image: "mock-dnp.dappnode.eth:0.0.0",
            container_name: "DAppNodePackage-mock-dnp.dappnode.eth",
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

      expect(manifestToCompose(manifest)).to.deep.equal({
        version: "3.4",
        services: {
          [name]: {
            image: "mock-dnp.dappnode.eth:0.0.0",
            container_name: "DAppNodePackage-mock-dnp.dappnode.eth"
          }
        }
      });
    });
  });

  describe("parseMetadataFromManifest", () => {
    it("Should parse metadata from a manifest", () => {
      const metadata: Manifest = {
        name: "mock-name",
        version: "0.0.0",
        description: "mock-description",
        type: "service",
        license: "MIT"
      };
      // ##### Dangerously casting an incorrect manifest to check
      // ##### if it ignores the image field
      const manifest: Manifest = {
        image: emptyImage,
        ...metadata
      } as Manifest;
      expect(parseMetadataFromManifest(manifest)).to.deep.equal(metadata);
    });
  });

  describe("sanitizeCompose", () => {
    it("Should parse metadata from a manifest", () => {
      const serviceName = Object.keys(mockCompose.services)[0];
      const okCompose: Compose = {
        ...mockCompose,
        services: {
          [serviceName]: {
            ...mockCompose.services[serviceName],
            ports,
            volumes
          }
        }
      };

      const composeWithExtraProps: Compose = {
        ...mockCompose,
        services: {
          [serviceName]: {
            ...mockCompose.services[serviceName],
            ports,
            volumes,
            logging: {
              options: {
                "max-size": "dangerous-property",
                "max-file": "dangerous-property"
              }
            }
          }
        },
        networks: {
          "dangerous-network": {}
        }
      };

      expect(sanitizeCompose(composeWithExtraProps, false)).to.deep.equal(
        okCompose
      );
    });
  });
});
/* eslint-enable @typescript-eslint/camelcase */
