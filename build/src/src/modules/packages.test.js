const chai = require('chai');
const sinon = require('sinon');
const pkg = require('./packages');
const getPath = require('./getPath');

const expect = require('chai').expect;
chai.use(require('sinon-chai'));


describe('Util: package install / download', () => {
  // ///// Make mocks for dependencies

  // params
  const params = {
    REPO_DIR: 'test/',
    DOCKERCOMPOSE_NAME: 'docker-compose.yml',
  };

  // getManifest
  const PACKAGE_NAME = 'myPackage';
  const IMAGE_HASH = 'imageHash';
  const IMAGE_NAME = 'imageName';
  const MANIFEST_PATH = getPath.manifest(PACKAGE_NAME, params);
  const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
  const IMAGE_PATH = getPath.image(PACKAGE_NAME, IMAGE_NAME, params);
  const dnpManifest = {image: {path: IMAGE_NAME, hash: IMAGE_HASH}};

  describe('.download', () => {
    // ipfs .download, .isfileHashValid
    const ipfsDownloadSpy = sinon.spy();
    const ipfsIsfileHashValidSpy = sinon.spy();
    let ipfsIsfileHashValidRETURN = false;
    const ipfsMock = {
      download: async (hash, path) => {
        ipfsDownloadSpy(hash, path);
      },
      isfileHashValid: async (hash, path) => {
        ipfsIsfileHashValidSpy(hash, path);
        return ipfsIsfileHashValidRETURN;
      },
    };

    // generate .DockerCompose .Manifest
    const generateManifestSpy = sinon.spy();
    const generateDockerComposeSpy = sinon.spy();
    const DockerCompose = 'DockerCompose';
    const Manifest = 'Manifest';
    const generateMock = {
      manifest: (dnpManifest) => {
        generateManifestSpy(dnpManifest);
        return 'Manifest';
      },
      dockerCompose: (dnpManifest) => {
        generateDockerComposeSpy(dnpManifest);
        return DockerCompose;
      },
    };

    // docker .load .compose.up
    const dockerLoadSpy = sinon.spy();
    const dockerMock = {
      compose: {
        load: dockerLoadSpy,
      },
    };

    // validate .path --> blindly accept all paths
    const validateMock = {
      path: (path) => {return path;},
    };

    // fs .writeFileSync, .existsSync, .unlinkSync
    const fsWriteFileSyncSpy = sinon.spy();
    const fsExistsSyncSpy = sinon.spy();
    const fsUnlinkSyncSpy = sinon.spy();
    const fsMock = {
      writeFileSync: async (data, path) => {
        fsWriteFileSyncSpy(data, path);
      },
      existsSync: async (path) => {
        fsExistsSyncSpy(path);
        return true;
      },
      unlinkSync: async (path) => {
        fsUnlinkSyncSpy(path);
      },
    };

    const download = pkg.downloadFactory({params,
      ipfs: ipfsMock,
      docker: dockerMock,
      generate: generateMock,
      validate: validateMock,
      fs: fsMock});


    download({
      pkg: {
        name: PACKAGE_NAME,
        manifest: dnpManifest,
      },
    });

    // generateManifestSpy - dnpManifest
    it('generate.Manifest should be called with dnpManifest', () => {
      sinon.assert.calledWith(generateManifestSpy, dnpManifest);
    });

    // generateDockerComposeSpy - dnpManifest
    it('generate.DockerCompose should be called with dnpManifest', () => {
      expect(generateDockerComposeSpy.getCalls()[0].args)
        .to.deep.equal( [dnpManifest] );
    });

    // fsWriteFileSyncSpy - DockerCompose, DOCKERCOMPOSE_PATH
    it('fs.writeFileSync should be called FIRST with DockerCompose, MANIFEST_PATH', () => {
      expect(fsWriteFileSyncSpy.getCalls()[0].args)
        .to.deep.equal( [MANIFEST_PATH, Manifest] );
    });

    it('fs.writeFileSync should be called SECOND with DockerCompose, DOCKERCOMPOSE_PATH', () => {
      expect(fsWriteFileSyncSpy.getCalls()[1].args)
        .to.deep.equal( [DOCKERCOMPOSE_PATH, DockerCompose] );
    });

    // ipfsDownloadSpy - IMAGE_HASH, IMAGE_PATH
    it('ipfs.download should be called with IMAGE_HASH, IMAGE_PATH', () => {
      sinon.assert.calledWith(ipfsDownloadSpy, IMAGE_HASH, IMAGE_PATH);
    });
  });


  describe('.run', () => {
    // ///// Make mocks for dependencies

    // docker .load .compose.up
    const dockerLoadSpy = sinon.spy();
    const dockerComposeUpSpy = sinon.spy();
    const dockerMock = {
      compose: {
        up: dockerComposeUpSpy,
      },
      load: dockerLoadSpy,
    };

    const run = pkg.runFactory({params,
      docker: dockerMock,
    });

    run({
      pkg: {
        name: PACKAGE_NAME,
        manifest: dnpManifest,
      },
    });

    it('docker.load should be called with IMAGE_PATH', () => {
      expect(dockerLoadSpy.getCalls()[0].args)
        .to.deep.equal( [IMAGE_PATH] );
    });

    // generateDockerComposeSpy - dnpManifest
    it('docker.compose.up should be called with DOCKERCOMPOSE_PATH', () => {
      expect(dockerComposeUpSpy.getCalls()[0].args)
        .to.deep.equal( [DOCKERCOMPOSE_PATH] );
    });
  });
});
