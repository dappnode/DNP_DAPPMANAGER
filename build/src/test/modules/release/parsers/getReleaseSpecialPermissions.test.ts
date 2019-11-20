import "mocha";
import { expect } from "chai";
import { getReleaseSpecialPermissions } from "../../../../src/modules/release/parsers/getReleaseSpecialPermissions";
import { mockCompose } from "../../../testUtils";
import { Compose } from "../../../../src/types";
import {
  parseServiceName,
  parseService
} from "../../../../src/utils/dockerComposeParsers";

/* eslint-disable @typescript-eslint/camelcase */
describe("Release > parsers", () => {
  describe("getReleaseSpecialPermissions", () => {
    it("Should detect various special permissions", () => {
      const serviceName = parseServiceName(mockCompose);
      const service = parseService(mockCompose);
      const isCore = true;
      const compose: Compose = {
        ...mockCompose,
        volumes: {
          dncore_ethchaindnpdappnodeeth_data: {
            external: {
              name: "dncore_ethchaindnpdappnodeeth_data"
            }
          },
          bitcoindnpdappnodeeth_data: {
            external: {
              name: "bitcoindnpdappnodeeth_data"
            }
          }
        },
        services: {
          [serviceName]: {
            ...service,
            networks: {
              network: {
                ipv4_address: "172.33.10.4"
              }
            },
            cap_add: ["NET_ADMIN", "SYS_ADMIN"],
            network_mode: "host"
          }
        }
      };

      const specialPermissions = getReleaseSpecialPermissions({
        compose,
        isCore
      });

      expect(specialPermissions.map(p => p.name)).to.deep.equal([
        "Access to core volume",
        "Access to DAppNode Package volume",
        "Privileged access to the system host",
        "Admin privileges in DAppNode's WAMP",
        "Privileged system capability NET_ADMIN",
        "Privileged system capability SYS_ADMIN",
        "Access to the host network"
      ]);
    });
  });
});
/* eslint-enable @typescript-eslint/camelcase */
