import "mocha";
import { expect } from "chai";

import { mergeUserSetToCompose } from "../../src/utils/configFiles";
import { Compose } from "../../src/types";
import { mockCompose } from "../testUtils";
import { parseServiceName } from "../../src/utils/dockerComposeParsers";
import { writeDefaultsToLabels } from "../../src/utils/containerLabelsDb";

describe("Util > mergeUserSet", () => {
  it("should merge the userSetDnpObjects", () => {
    const defaultEnvironment = ["ENV1=DEFAULTVAL1", "ENV2=DEFAULTVAL2"];
    const defaultPorts = ["30303", "30303/udp", "30304:30304"];
    const defaultVolumes = ["kovan:/root/.local/share/io.parity.ethereum/"];

    const serviceName = parseServiceName(mockCompose);
    const compose: Compose = {
      ...mockCompose,
      services: {
        [serviceName]: {
          ...mockCompose.services[serviceName],
          environment: defaultEnvironment,
          ports: defaultPorts,
          volumes: defaultVolumes
        }
      }
    };

    const userSetDnpEnvs = {
      ENV1: "USER_SET_VAL1"
    };

    const userSetDnpPorts = {
      "30303": "31313:30303",
      "30303/udp": "31313:30303/udp",
      "30304:30304": "30304"
    };

    const userSetDnpVols = {
      "kovan:/root/.local/share/io.parity.ethereum/":
        "different_path:/root/.local/share/io.parity.ethereum/"
    };

    const previousEnvs = {
      ENV2: "PREVIOUS_SET_VAL2"
    };

    const expectedImageData: Compose = {
      ...mockCompose,
      services: {
        [serviceName]: {
          ...mockCompose.services[serviceName],
          environment: ["ENV1=USER_SET_VAL1", "ENV2=PREVIOUS_SET_VAL2"],
          ports: ["31313:30303", "31313:30303/udp", "30304"],
          volumes: ["different_path:/root/.local/share/io.parity.ethereum/"],
          labels: writeDefaultsToLabels({
            defaultEnvironment,
            defaultVolumes,
            defaultPorts
          })
        }
      }
    };

    expect(
      mergeUserSetToCompose(compose, {
        userSetDnpEnvs,
        userSetDnpPorts,
        userSetDnpVols,
        previousEnvs
      })
    ).to.deep.equal(expectedImageData);
  });
});
