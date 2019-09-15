import "mocha";
import { expect } from "chai";

import { mergeUserSetToCompose } from "../../src/utils/configFiles";
import { Compose } from "../../src/types";
import { mockCompose } from "../testUtils";
import { parseServiceName } from "../../src/utils/dockerComposeParsers";
import { writeDefaultsToLabels } from "../../src/utils/containerLabelsDb";

describe("Util > mergeUserSet", () => {
  it("should merge the userSetDnpObjects", () => {
    const commonEnvs = ["ENV1=DEFAULTVAL1"];
    const commonPorts = ["30303", "30303/udp", "30304:30304"];
    const commonVols = ["kovan:/root/.local/share/io.parity.ethereum/"];

    // Data in the about to install manifest / docker-compose
    const defaultEnvironment = [...commonEnvs, "ENV2=DEFAULTVAL2"];
    const defaultPorts = [...commonPorts, "8080:8080"];
    const defaultVolumes = [...commonVols, "sync-data:/root/.sync"];

    // Data in the previously installed manifest / docker-compose
    // This represent previous adjustments made by the user
    const previousEnvs: string[] = [...commonEnvs, "ENV2=PREVIOUS_SET_VAL2"];
    const previousPorts: string[] = [...commonPorts, "3000:8080"];
    const previousVolumes: string[] = [...commonVols, "/dev1:/root/.sync"];

    // Data introduced by the user at the moment of installing
    // [NOTE]: the user should be seeing a merge of [default + previous]
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

    const expectedImageData: Compose = {
      ...mockCompose,
      services: {
        [serviceName]: {
          ...mockCompose.services[serviceName],
          environment: ["ENV1=USER_SET_VAL1", "ENV2=PREVIOUS_SET_VAL2"],
          ports: ["31313:30303", "31313:30303/udp", "30304", "3000:8080"],
          volumes: [
            "different_path:/root/.local/share/io.parity.ethereum/",
            "/dev1:/root/.sync"
          ],
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
        previousEnvs,
        previousPorts,
        previousVolumes
      })
    ).to.deep.equal(expectedImageData);
  });
});
