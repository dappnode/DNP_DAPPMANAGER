import "mocha";
import chai, { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import params from "../../src/params";
import rewiremock from "rewiremock";
import { mockManifest, cleanTestDir, createTestDir } from "../testUtils";
chai.use(require("sinon-chai"));
// Imports for typings
import * as packagesType from "../../src/modules/packages";

describe("Util: package install / download", () => {
  // ///// Make mocks for dependencies

  // params
  params.REPO_DIR = "test_files/";

  // getManifest
  const dnpName = "myPackage";
  const id = dnpName;
  const isCore = false;
  const imageName = "imageName";
  const imageHash = "imageHash";
  const imageSize = 1111;
  const dockerComposePath = getPath.dockerCompose(dnpName, params, isCore);
  const imagePath = getPath.image(dnpName, imageName, params, isCore);
  const dnpManifest = {
    ...mockManifest,
    name: dnpName,
    image: {
      ...mockManifest.image,
      path: imageName,
      hash: imageHash,
      size: imageSize
    }
  };

  const downloadImage = sinon.stub();

  const dockerLoad = sinon.stub();
  const dockerImages = sinon.stub();
  const dockerRmi = sinon.stub();
  const dockerComposeUpSafe = sinon.stub();

  let packages: typeof packagesType;

  before("Mock", async () => {
    packages = await rewiremock.around(
      () => import("../../src/modules/packages"),
      mock => {
        mock(() => import("../../src/modules/release/getImage"))
          .withDefault(downloadImage)
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerCommands"))
          .with({ dockerLoad, dockerImages, dockerRmi })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerSafe"))
          .with({ dockerComposeUpSafe })
          .toBeUsed();
      }
    );
  });

  before(async () => {
    await createTestDir();
    fs.mkdirSync(getPath.packageRepoDir(dnpName, params, isCore));
    fs.writeFileSync(imagePath, "MOCK-CONTENT");
  });

  it("Should .download", async () => {
    await packages.download({
      pkg: {
        name: dnpName,
        manifest: dnpManifest,
        ver: "0.1.0",
        isCore: false
      },
      id
    });

    expect(downloadImage.firstCall.args.slice(0, 3)).to.deep.equal(
      [imageHash, imagePath, imageSize],
      "ipfs.download should be called with imageHash, imagePath"
    );
  });

  it("Should .load", async () => {
    await packages.load({
      pkg: {
        name: dnpName,
        manifest: dnpManifest,
        ver: "0.1.0",
        isCore: false
      },
      id
    });

    expect(dockerLoad.firstCall.args).to.deep.equal(
      [imagePath],
      "docker.load should be called with imagePath"
    );
  });

  it("Should .run", async () => {
    await packages.run({
      pkg: {
        name: dnpName,
        manifest: dnpManifest,
        ver: "0.1.0",
        isCore: false
      },
      id
    });

    expect(dockerComposeUpSafe.firstCall.args).to.deep.equal(
      [dockerComposePath],
      "docker.compose.up should be called with dockerComposePath"
    );
  });

  after(async () => {
    await cleanTestDir();
  });
});
