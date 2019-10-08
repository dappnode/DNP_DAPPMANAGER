import "mocha";
import { expect } from "chai";
import fs from "fs";
import yaml from "js-yaml";
import { Compose } from "../../src/types";
import { mockCompose, createTestDir, cleanTestDir } from "../testUtils";
import { parseServiceName } from "../../src/utils/dockerComposeParsers";
import { writeDefaultsToLabels } from "../../src/utils/containerLabelsDb";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";

import {
  mergeUserSetToCompose,
  convertLegacyEnvFiles
} from "../../src/utils/configFiles";

describe("Util > configFiles", () => {
  describe("mergeUserSetToCompose", () => {
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
        "kovan:/root/.local/share/io.parity.ethereum//":
          "different_path:/root/.local/share/io.parity.ethereum//"
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
              "different_path:/root/.local/share/io.parity.ethereum",
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

  describe("convertLegacyEnvFiles", () => {
    before(async () => {
      await createTestDir();
    });

    it("Should NOT break a compose for an empty .env file", () => {
      const name = "mock-dnp.dnp.dappnode.eth";
      const isCore = false;
      const envFilePath = getPath.envFile(name, isCore);
      const composePath = getPath.dockerCompose(name, isCore);
      const compose = {
        version: "3.4",
        services: { [name]: { image: `${name}:0.2.0` } }
      };
      const composeString = yaml.safeDump(compose);
      validate.path(envFilePath);
      fs.writeFileSync(envFilePath, "");
      fs.writeFileSync(composePath, composeString);

      const res = convertLegacyEnvFiles({ name, isCore });
      expect(res).to.equal(
        true,
        "Should return true, indicating it merged ENVs"
      );
      expect(fs.existsSync(envFilePath)).to.equal(
        false,
        ".env file should not exist"
      );
      expect(fs.readFileSync(composePath, "utf8")).to.equal(
        composeString,
        "Compose file should not be changed"
      );
    });

    it("Should merge existing envs", () => {
      const name = "mock2-dnp.dnp.dappnode.eth";
      const isCore = false;
      const envFilePath = getPath.envFile(name, isCore);
      const composePath = getPath.dockerCompose(name, isCore);
      const envsString = "NAME=VALUE";
      const composeString = yaml.safeDump({
        version: "3.4",
        services: { [name]: { image: `${name}:0.2.0` } }
      });
      validate.path(envFilePath);
      fs.writeFileSync(envFilePath, envsString);
      fs.writeFileSync(composePath, composeString);

      const res = convertLegacyEnvFiles({ name, isCore });
      expect(res).to.equal(
        true,
        "Should return true, indicating it merged ENVs"
      );
      expect(fs.existsSync(envFilePath)).to.equal(
        false,
        ".env file should not exist"
      );
      expect(fs.readFileSync(composePath, "utf8")).to.equal(
        yaml.safeDump({
          version: "3.4",
          services: {
            [name]: { image: `${name}:0.2.0`, environment: [envsString] }
          }
        }),
        "Compose file should now include the envs"
      );
    });

    it("Should ignore a DNP without .env", () => {
      const name = "mock3-dnp.dnp.dappnode.eth";
      const isCore = false;

      const res = convertLegacyEnvFiles({ name, isCore });
      expect(res).to.equal(
        false,
        "Should return false, indicating it did not merge ENVs"
      );
    });

    after(async () => {
      await cleanTestDir();
    });
  });
});
