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
  const dnpName = "myPackage";
  const imageHash = "imageHash";
  const imageName = "imageName";
  const manifestPath = getPath.manifest(dnpName, params);
  const dockerComposePath = getPath.dockerCompose(dnpName, params);
  const imagePath = getPath.image(dnpName, imageName, params);
  const isCore = false;
  const version = "0.2.0";
  const dnpManifest = {
    name: dnpName,
    version,
    isCore,
    image: {
      path: imageName,
      hash: imageHash
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
    loadImage: dockerLoadSpy,
    composeUp: dockerComposeUpSpy
  };

  // validate .path --> blindly accept all paths
  const validate = {
    path: path => path
  };

  // fs .writeFileSync, .existsSync, .unlinkSync
  const fsWriteFileSpy = sinon.spy();
  const fsExistsSyncSpy = sinon.spy();
  const fs = {
    writeFile: async (data, path, callback) => {
      fsWriteFileSpy(data, path);
      callback(null, "great success");
    },
    existsSync: async path => {
      fsExistsSyncSpy(path);
      return true;
    }
  };

  const { download, load, run } = proxyquire("modules/packages", {
    "modules/downloadImage": downloadImage,
    "modules/docker": docker,
    "utils/generate": generate,
    "utils/validate": validate,
    fs: fs,
    params: params
  });

  it("Should download a DNP", async () => {
    await download({
      pkg: { name: dnpName, manifest: dnpManifest }
    });
    sinon.assert.calledWith(downloadImageSpy, imageHash, imagePath);
  });

  it("Should load a DNP image", async () => {
    await load({
      pkg: {
        name: dnpName,
        manifest: dnpManifest
      }
    });
    sinon.assert.calledWith(generateManifestSpy, dnpManifest);
    expect(generateDockerComposeSpy.getCalls()[0].args).to.deep.equal(
      [dnpManifest],
      "wrong arguments for generateDockerCompose"
    );
    expect(fsWriteFileSpy.getCalls()[0].args).to.deep.equal(
      [manifestPath, Manifest],
      "wrong arguments for fsWriteFileSpy first call"
    );
    expect(fsWriteFileSpy.getCalls()[1].args).to.deep.equal(
      [dockerComposePath, DockerCompose],
      "wrong arguments for fs.writeFileSync SECOND call"
    );
    expect(dockerLoadSpy.getCalls()[0].args).to.deep.equal(
      [dnpName, version, isCore],
      "wrong arguments for docker.load"
    );
  });

  it("Should run a DNP", async () => {
    await run({
      pkg: { name: dnpName, manifest: dnpManifest }
    });
    expect(dockerComposeUpSpy.getCalls()[0].args).to.deep.equal(
      [dnpName, { isCore }],
      "wrong arguments for docker.compose.up"
    );
  });
});
