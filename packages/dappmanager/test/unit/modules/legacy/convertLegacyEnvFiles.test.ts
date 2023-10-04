import "mocha";
import { expect } from "chai";
import fs from "fs";
import { createTestDir, cleanTestDir } from "../../../testUtils.js";
import * as getPath from "../../../../src/utils/getPath.js";
import { yamlDump } from "../../../../src/utils/yaml.js";
import { migrateLegacyEnvFile } from "../../../../src/modules/migrations/removeLegacyDockerAssets.js";
import { getDockerComposePath, validatePath } from "@dappnode/utils";

describe("migrateLegacyEnvFiles", () => {
  before(async () => {
    await createTestDir();
  });

  it("Should NOT break a compose for an empty .env file", () => {
    const dnpName = "mock-dnp.dnp.dappnode.eth";
    const isCore = false;
    const envFilePath = getPath.envFile(dnpName, isCore);
    const composePath = getDockerComposePath(dnpName, isCore);
    const compose = {
      version: "3.5",
      services: { [dnpName]: { image: `${dnpName}:0.2.0` } }
    };
    const composeString = yamlDump(compose);
    validatePath(envFilePath);
    fs.writeFileSync(envFilePath, "");
    fs.writeFileSync(composePath, composeString);

    const res = migrateLegacyEnvFile(dnpName, isCore);
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
    const dnpName = "mock2-dnp.dnp.dappnode.eth";
    const isCore = false;
    const envFilePath = getPath.envFile(dnpName, isCore);
    const composePath = getDockerComposePath(dnpName, isCore);
    const envsString = "NAME=VALUE";
    const composeString = yamlDump({
      version: "3.5",
      services: {
        [dnpName]: {
          image: `${dnpName}:0.2.0`,
          env_file: [dnpName + ".env"]
        }
      }
    });
    validatePath(envFilePath);
    fs.writeFileSync(envFilePath, envsString);
    fs.writeFileSync(composePath, composeString);

    const res = migrateLegacyEnvFile(dnpName, isCore);
    expect(res).to.equal(true, "Should return true, indicating it merged ENVs");
    expect(fs.existsSync(envFilePath)).to.equal(
      false,
      ".env file should not exist"
    );
    expect(fs.readFileSync(composePath, "utf8")).to.equal(
      yamlDump({
        version: "3.5",
        services: {
          [dnpName]: {
            image: `${dnpName}:0.2.0`,
            environment: [envsString]
          }
        }
      }),
      "Compose file should now include the envs"
    );
  });

  it("Should ignore a DNP without .env", () => {
    const dnpName = "mock3-dnp.dnp.dappnode.eth";
    const isCore = false;

    const res = migrateLegacyEnvFile(dnpName, isCore);
    expect(res).to.equal(
      false,
      "Should return false, indicating it did not merge ENVs"
    );
  });

  after(async () => {
    await cleanTestDir();
  });
});
