import "mocha";
import { expect } from "chai";
import fs from "fs";
import yaml from "js-yaml";
import { createTestDir, cleanTestDir } from "../../testUtils";
import * as getPath from "../../../src/utils/getPath";
import * as validate from "../../../src/utils/validate";

import { migrateLegacyEnvFile } from "../../../src/modules/legacy/migrateLegacyEnvFiles";
import { parseEnvironment } from "../../../src/modules/compose";

describe("migrateLegacyEnvFiles", () => {
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

    const res = migrateLegacyEnvFile(name, isCore);
    expect(res).to.equal(true, "Should return true, indicating it merged ENVs");
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
      services: {
        [name]: {
          image: `${name}:0.2.0`,
          env_file: [name + ".env"]
        }
      }
    });
    validate.path(envFilePath);
    fs.writeFileSync(envFilePath, envsString);
    fs.writeFileSync(composePath, composeString);

    const res = migrateLegacyEnvFile(name, isCore);
    expect(res).to.equal(true, "Should return true, indicating it merged ENVs");
    expect(fs.existsSync(envFilePath)).to.equal(
      false,
      ".env file should not exist"
    );
    expect(fs.readFileSync(composePath, "utf8")).to.equal(
      yaml.safeDump({
        version: "3.4",
        services: {
          [name]: {
            image: `${name}:0.2.0`,
            environment: parseEnvironment([envsString])
          }
        }
      }),
      "Compose file should now include the envs"
    );
  });

  it("Should ignore a DNP without .env", () => {
    const name = "mock3-dnp.dnp.dappnode.eth";
    const isCore = false;

    const res = migrateLegacyEnvFile(name, isCore);
    expect(res).to.equal(
      false,
      "Should return false, indicating it did not merge ENVs"
    );
  });

  after(async () => {
    await cleanTestDir();
  });
});
