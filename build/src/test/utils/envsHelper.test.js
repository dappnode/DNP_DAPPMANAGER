const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const shell = require("utils/shell");
const fs = require("fs");

const testDirectory = "./test_files/";

const envsHelper = proxyquire("utils/envsHelper", {
  params: {
    ...require("params"),
    REPO_DIR: testDirectory,
    DNCORE_DIR: testDirectory
  }
});

// module.exports = {
//     load: loadEnvs,
//     write: writeEnvs,
//     getManifestEnvs,
//   };

describe("Util: envsHelper", () => {
  const name = "dnp-a.dnp.dappnode.eth";
  const isCore = false;
  const envPath = `${testDirectory}/${name}/${name}.env`;

  before(async () => {
    await shell(`mkdir -p ${testDirectory}/${name}`);
    fs.writeFileSync(envPath, "ENV_NAME1=on-disk-value");
  });

  it("should merge envs and write them", () => {
    const pkg = {
      manifest: {
        name,
        isCore,
        image: {
          environment: [
            "ENV_NAME1=manifest_value",
            "ENV_NAME2=manifest_value",
            "ENV_NAME3=manifest_value"
          ]
        }
      }
    };
    const userSetEnvs = {
      [name]: {
        ENV_NAME3: "user-set"
      }
    };

    const defaultEnvs = envsHelper.getManifestEnvs(pkg.manifest);
    const previousEnvs = envsHelper.load(name, isCore);
    const envs = {
      ...defaultEnvs,
      ...previousEnvs,
      ...userSetEnvs[pkg.manifest.name]
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
