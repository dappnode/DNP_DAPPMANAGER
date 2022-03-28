import "mocha";
import { expect, assert } from "chai";
import { Compose } from "../../../src/types";
import { mockManifest, mockCompose } from "../../testUtils";

import { parseUnsafeCompose } from "../../../src/modules/compose/unsafeCompose";

describe("parseUnsafeCompose", () => {
  it("Should sanitize an unsafe compose", () => {
    const customLogging = { driver: "syslog" };
    const ports = ["1111/1111", "1111/1111:udp"];
    const volumes = ["mockdnpdappnodeeth_data:/mock/mock/mock/"];
    const serviceName = Object.keys(mockCompose.services)[0];
    const dangerousNetwork = "dangerous-network";

    const composeWithExtraProps: Compose = {
      ...mockCompose,
      services: {
        [serviceName]: {
          ...mockCompose.services[serviceName],
          ports,
          volumes,
          logging: customLogging
        }
      },
      networks: {
        [dangerousNetwork]: {
          driver: "bad-driver"
        }
      }
    };

    const expectedCompose: Compose = {
      ...mockCompose,
      services: {
        [serviceName]: {
          ...mockCompose.services[serviceName],
          restart: "unless-stopped",
          ports,
          volumes,
          logging: customLogging,
          dns: "172.33.1.2",
          networks: {
            dncore_network: {
              aliases: ["mock-dnp.dappnode"]
            }
          }
        }
      },
      networks: {
        dncore_network: {
          external: true
        },
        [dangerousNetwork]: {}
      }
    };

    const compose = parseUnsafeCompose(composeWithExtraProps, mockManifest);

    expect(compose).to.deep.equal(expectedCompose);
  });

  it("Should throw error due to an unwhitelisted dnp attempting to share the docker socket as a volume", () => {
    const customLogging = { driver: "syslog" };
    const ports = ["1111/1111", "1111/1111:udp"];
    const volumes = ["/var/run/docker.sock:/var/run/docker.sock"];
    const serviceName = Object.keys(mockCompose.services)[0];
    const dangerousNetwork = "dangerous-network";

    const composeWithExtraProps: Compose = {
      ...mockCompose,
      services: {
        [serviceName]: {
          ...mockCompose.services[serviceName],
          ports,
          volumes,
          logging: customLogging
        }
      },
      networks: {
        [dangerousNetwork]: {
          driver: "bad-driver"
        }
      }
    };

    assert.throw(() => {
      parseUnsafeCompose(composeWithExtraProps, mockManifest);
    }, Error);
  });
});
