import "mocha";
import chai from "chai";
import sinon from "sinon";
import * as getPath from "../../src/utils/getPath";
import params from "../../src/params";
const proxyquire = require("proxyquire").noCallThru();
const { manifestToCompose } = require("@dappnode/dnp-manifest");
const expect = chai.expect;
chai.use(require("sinon-chai"));

describe("Util: package install / download", () => {
  // ///// Make mocks for dependencies

  // params
  params.REPO_DIR = "test_files/";

  // getManifest
  const PACKAGE_NAME = "myPackage";
  const IMAGE_HASH = "imageHash";
  const IMAGE_NAME = "imageName";
  const MANIFEST_PATH = getPath.manifest(PACKAGE_NAME, params, false);
  const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params, false);
  const IMAGE_PATH = getPath.image(PACKAGE_NAME, IMAGE_NAME, params, false);
  const dnpManifest = {
    name: PACKAGE_NAME,
    image: {
      path: IMAGE_NAME,
      hash: IMAGE_HASH
    }
  };

  // ipfs .download, .isfileHashValid
  const downloadImageSpy = sinon.spy();
  const downloadImage = async (hash: string, path: string): Promise<void> => {
    downloadImageSpy(hash, path);
  };

  // docker .load .compose.up
  const dockerLoadSpy = sinon.spy();
  const dockerComposeUpSpy = sinon.spy();
  const docker = {
    load: dockerLoadSpy,
    compose: {
      up: dockerComposeUpSpy
    },
    images: async (): Promise<void> => {}
  };

  // validate .path --> blindly accept all paths
  const validate = {
    path: (path: string): string => path
  };

  // fs .writeFileSync, .existsSync, .unlinkSync
  const fsWriteFileSpy = sinon.spy();
  const fsExistsSyncSpy = sinon.spy();
  const fsUnlinkSpy = sinon.spy();
  const fs = {
    writeFile: async (
      data: string,
      path: string,
      callback: (err: null, res: string) => void
    ): Promise<void> => {
      fsWriteFileSpy(data, path);
      callback(null, "great success");
    },
    existsSync: async (path: string): Promise<boolean> => {
      fsExistsSyncSpy(path);
      return true;
    },
    unlink: (
      path: string,
      callback: (err: null, res: string) => void
    ): void => {
      fsUnlinkSpy(path);
      callback(null, "great success");
    }
  };

  const { download, load, run } = proxyquire("../../src/modules/packages", {
    "../modules/downloadImage": downloadImage,
    "../modules/docker": docker,
    "../utils/validate": validate,
    "../params": params,
    fs: fs
  });

  it("Should .download", async () => {
    await download({
      pkg: {
        name: PACKAGE_NAME,
        manifest: dnpManifest
      }
    });

    expect(downloadImageSpy.getCall(0).args).to.deep.equal(
      [IMAGE_HASH, IMAGE_PATH],
      "ipfs.download should be called with IMAGE_HASH, IMAGE_PATH"
    );
  });

  it("Should .load", async () => {
    await load({
      pkg: {
        name: PACKAGE_NAME,
        manifest: dnpManifest
      }
    });

    expect(fsWriteFileSpy.getCalls()[0].args).to.deep.equal(
      [MANIFEST_PATH, JSON.stringify(dnpManifest, null, 2)],
      "fs.writeFileSync should be called FIRST with DockerCompose, MANIFEST_PATH"
    );
    expect(fsWriteFileSpy.getCalls()[1].args).to.deep.equal(
      [DOCKERCOMPOSE_PATH, manifestToCompose(dnpManifest)],
      "fs.writeFileSync should be called SECOND with DockerCompose, DOCKERCOMPOSE_PATH"
    );
    expect(dockerLoadSpy.getCalls()[0].args).to.deep.equal(
      [IMAGE_PATH],
      "docker.load should be called with IMAGE_PATH"
    );
    expect(fsUnlinkSpy.getCalls()[0].args).to.deep.equal(
      [IMAGE_PATH],
      "fs.unlink promisified should be called with IMAGE_PATH"
    );
  });

  it("Should .run", async () => {
    await run({
      pkg: {
        name: PACKAGE_NAME,
        manifest: dnpManifest
      }
    });

    expect(dockerComposeUpSpy.getCalls()[0].args).to.deep.equal(
      [DOCKERCOMPOSE_PATH],
      "docker.compose.up should be called with DOCKERCOMPOSE_PATH"
    );
  });
});
