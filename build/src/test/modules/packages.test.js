const proxyquire = require("proxyquire");
const chai = require("chai");
const sinon = require("sinon");
const getPath = require("utils/getPath");
const params = require("params");

const expect = require("chai").expect;
chai.use(require("sinon-chai"));

describe("Util: package install / download", () => {
  // ///// Make mocks for dependencies

  // params
  params.REPO_DIR = "test_files/";

  // getManifest
  const PACKAGE_NAME = "myPackage";
  const IMAGE_HASH = "imageHash";
  const IMAGE_NAME = "imageName";
  const MANIFEST_PATH = getPath.manifest(PACKAGE_NAME, params);
  const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
  const IMAGE_PATH = getPath.image(PACKAGE_NAME, IMAGE_NAME, params);
  const dnpManifest = {
    name: PACKAGE_NAME,
    image: {
      path: IMAGE_NAME,
      hash: IMAGE_HASH
    }
  };

  // ipfs .download, .isfileHashValid
  const downloadImageSpy = sinon.spy();
  const downloadImage = async (hash, path) => {
    downloadImageSpy(hash, path);
  };

  // generate .DockerCompose .Manifest
  const generateManifestSpy = sinon.spy();
  const generateDockerComposeSpy = sinon.spy();
  const DockerCompose = "DockerCompose";
  const Manifest = "Manifest";
  const generate = {
    manifest: dnpManifest => {
      generateManifestSpy(dnpManifest);
      return "Manifest";
    },
    dockerCompose: dnpManifest => {
      generateDockerComposeSpy(dnpManifest);
      return DockerCompose;
    }
  };

  // docker .load .compose.up
  const dockerLoadSpy = sinon.spy();
  const dockerComposeUpSpy = sinon.spy();
  const docker = {
    load: dockerLoadSpy,
    compose: {
      up: dockerComposeUpSpy
    }
  };

  // validate .path --> blindly accept all paths
  const validate = {
    path: path => path
  };

  // fs .writeFileSync, .existsSync, .unlinkSync
  const fsWriteFileSpy = sinon.spy();
  const fsExistsSyncSpy = sinon.spy();
  const fsUnlinkSpy = sinon.spy();
  const fs = {
    writeFile: async (data, path, callback) => {
      fsWriteFileSpy(data, path);
      callback(null, "great success");
    },
    existsSync: async path => {
      fsExistsSyncSpy(path);
      return true;
    },
    unlink: (PATH, callback) => {
      fsUnlinkSpy(PATH);
      callback(null, "great success");
    }
  };

  const { download, run } = proxyquire("modules/packages", {
    "modules/downloadImage": downloadImage,
    "modules/docker": docker,
    "utils/generate": generate,
    "utils/validate": validate,
    fs: fs,
    params: params
  });

  describe(".download", () => {
    download({
      pkg: {
        name: PACKAGE_NAME,
        manifest: dnpManifest
      }
    });

    // generateManifestSpy - dnpManifest
    it("generate.Manifest should be called with dnpManifest", () => {
      sinon.assert.calledWith(generateManifestSpy, dnpManifest);
    });

    // generateDockerComposeSpy - dnpManifest
    it("generate.DockerCompose should be called with dnpManifest", () => {
      expect(generateDockerComposeSpy.getCalls()[0].args).to.deep.equal([
        dnpManifest
      ]);
    });

    // fsWriteFileSpy - DockerCompose, DOCKERCOMPOSE_PATH
    it("fs.writeFileSync should be called FIRST with DockerCompose, MANIFEST_PATH", () => {
      expect(fsWriteFileSpy.getCalls()[0].args).to.deep.equal([
        MANIFEST_PATH,
        Manifest
      ]);
    });

    it("fs.writeFileSync should be called SECOND with DockerCompose, DOCKERCOMPOSE_PATH", () => {
      expect(fsWriteFileSpy.getCalls()[1].args).to.deep.equal([
        DOCKERCOMPOSE_PATH,
        DockerCompose
      ]);
    });

    // downloadImageSpy - IMAGE_HASH, IMAGE_PATH
    it("ipfs.download should be called with IMAGE_HASH, IMAGE_PATH", () => {
      sinon.assert.calledWith(downloadImageSpy, IMAGE_HASH, IMAGE_PATH);
    });

    it("docker.load should be called with IMAGE_PATH", () => {
      expect(dockerLoadSpy.getCalls()[0].args).to.deep.equal([IMAGE_PATH]);
    });

    it("fs.unlink promisified should be called with IMAGE_PATH", () => {
      expect(fsUnlinkSpy.getCalls()[0].args).to.deep.equal([IMAGE_PATH]);
    });
  });

  describe(".run", () => {
    run({
      pkg: {
        name: PACKAGE_NAME,
        manifest: dnpManifest
      }
    });

    // generateDockerComposeSpy - dnpManifest
    it("docker.compose.up should be called with DOCKERCOMPOSE_PATH", () => {
      expect(dockerComposeUpSpy.getCalls()[0].args).to.deep.equal([
        DOCKERCOMPOSE_PATH
      ]);
    });
  });
});
