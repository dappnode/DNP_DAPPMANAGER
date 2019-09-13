import "mocha";
import { expect } from "chai";
import shell from "../../src/utils/shell";
import fs from "fs";
import { mockManifestWithImage } from "../testUtils";
import { UserSetPackageEnvs, ManifestWithImage } from "../../src/types";

import * as envsHelper from "../../src/utils/envsHelper";

const testDirectory = "./test_files/";

describe("Util: envsHelper", () => {
  const name = "dnp-a.dnp.dappnode.eth";
  const isCore = false;
  const envPath = `${testDirectory}/${name}/${name}.env`;

  before(async () => {
    await shell(`mkdir -p ${testDirectory}/${name}`);
    fs.writeFileSync(envPath, "ENV_NAME1=on-disk-value");
  });

  it("should merge envs and write them", () => {
    const manifest: ManifestWithImage = {
      ...mockManifestWithImage,
      name,
      image: {
        ...mockManifestWithImage.image,
        environment: [
          "ENV_NAME1=manifest_value",
          "ENV_NAME2=manifest_value",
          "ENV_NAME3=manifest_value"
        ]
      }
    };

    const userSetEnvs: UserSetPackageEnvs = {
      [name]: {
        ENV_NAME3: "user-set"
      }
    };

    const defaultEnvs = envsHelper.getManifestEnvs(manifest);
    const previousEnvs = envsHelper.load(name, isCore);
    const envs = {
      ...defaultEnvs,
      ...previousEnvs,
      ...userSetEnvs[manifest.name]
    };
    envsHelper.write(name, isCore, envs);

    const _envs = fs.readFileSync(envPath, "utf8");

    expect(_envs).to.equal(
      `
ENV_NAME1=on-disk-value
ENV_NAME2=manifest_value
ENV_NAME3=user-set`.trim()
    );
  });

  after(async () => {
    await shell(`rm -rf ${testDirectory}`);
  });
});
