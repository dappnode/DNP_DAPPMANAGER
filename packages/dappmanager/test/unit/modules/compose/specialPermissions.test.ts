import "mocha";
import { expect } from "chai";
import { mapValues } from "lodash-es";
import { parseSpecialPermissions } from "../../../../src/modules/compose/specialPermissions.js";
import { mockCompose } from "../../../testUtils.js";
import { Compose } from "@dappnode/types";

describe("Modules > compose", () => {
  describe("parseSpecialPermissions", () => {
    it("Should detect various special permissions", () => {
      const isCore = true;
      const compose: Compose = {
        ...mockCompose,
        services: mapValues(mockCompose.services, service => ({
          ...service,
          privileged: true,
          networks: {
            network: {
              ipv4_address: "172.33.10.4"
            }
          },
          cap_add: ["NET_ADMIN", "SYS_ADMIN"],
          network_mode: "host"
        }))
      };

      const specialPermissions = parseSpecialPermissions(compose, isCore);

      expect(specialPermissions.map(p => p.name)).to.deep.equal([
        "Privileged access to the system host",
        "Admin privileges in DAppNode's API",
        "Privileged system capability NET_ADMIN",
        "Privileged system capability SYS_ADMIN",
        "Access to the host network"
      ]);
    });
  });
});
