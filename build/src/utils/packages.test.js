const chai = require('chai')
const sinon = require('sinon')
const pkg = require('./packages')
const getPath = require('./getPath')

const expect = require('chai').expect
chai.use(require('sinon-chai'))


describe('Util: package install / download', () => {

  let log = [];
  const asyncFunction = async (pkg) => {
    log.push('start-'+pkg.name)
    await delay(pkg.time)
    log.push('ended-'+pkg.name)
    return 'res-'+pkg.name
  }
  const packageList = [
    {name: 'A', time: 10},
    {name: 'B', time: 1}
  ]

  const runPackages = pkg.createRunPackages(asyncFunction)
  const downloadPackages = pkg.createDownloadPackages(asyncFunction)

  describe('.runPackages', () => {

    let res

    it('should run async tasks in series', async () => {
      log = []
      res = await runPackages(packageList)
      expect( log )
        .to.deep.equal([ 'start-A', 'ended-A', 'start-B', 'ended-B' ])
    })

    it('should return an ordered response', () => {
      expect( res )
        .to.deep.equal([ 'res-A', 'res-B' ])
    })
  })


  describe('.downloadPackages', () => {

    let res

    it('should run async tasks in paralel', async () => {
      log = []

      res = await downloadPackages(packageList)
      expect( log )
        .to.deep.equal([ 'start-A', 'start-B', 'ended-B', 'ended-A' ])
    })

    it('should return an ordered response', () => {
      expect( res )
        .to.deep.equal([ 'res-A', 'res-B' ])
    })
  })


  /////// Make mocks for dependencies

  // params
  const params = {
    REPO_DIR: 'test/',
    DOCKERCOMPOSE_NAME: 'docker-compose.yml'
  }

  // getManifest
  const PACKAGE_NAME = 'myPackage'
  const IMAGE_HASH = 'imageHash'
  const IMAGE_NAME = 'imageName'
  const MANIFEST_PATH = getPath.MANIFEST(PACKAGE_NAME, params)
  const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
  const IMAGE_PATH = getPath.IMAGE(PACKAGE_NAME, IMAGE_NAME, params)
  const dnpManifest = {image:{path: IMAGE_NAME, hash: IMAGE_HASH}}


  describe('.download', () => {

    // ipfsCalls .download, .isfileHashValid
    const ipfs_download_spy = sinon.spy()
    const ipfs_isfileHashValid_spy = sinon.spy()
    let ipfs_isfileHashValid_RETURN = false
    const ipfsCallsMock = {
      download: async (hash, path) => {
        ipfs_download_spy(hash, path)
      },
      isfileHashValid: async (hash, path) => {
        ipfs_isfileHashValid_spy(hash, path)
        return ipfs_isfileHashValid_RETURN
      }
    }

    // generate .DockerCompose .Manifest
    const generate_Manifest_spy = sinon.spy()
    const generate_DockerCompose_spy = sinon.spy()
    const DockerCompose = 'DockerCompose'
    const Manifest = 'Manifest'
    const generateMock = {
      manifest: (dnpManifest) => {
        generate_Manifest_spy(dnpManifest)
        return 'Manifest'
      },
      dockerCompose: (dnpManifest) => {
        generate_DockerCompose_spy(dnpManifest)
        return DockerCompose
      }
    }

    // validate .path --> blindly accept all paths
    const validateMock = {
      path: (path) => { return path }
    }

    // fs .writeFileSync, .existsSync, .unlinkSync
    const fs_writeFileSync_spy = sinon.spy()
    const fs_existsSync_spy = sinon.spy()
    const fs_unlinkSync_spy = sinon.spy()
    const fsMock = {
      writeFileSync: async (data, path) => {
        fs_writeFileSync_spy(data, path)
      },
      existsSync: async (path) => {
        fs_existsSync_spy(path)
        return true
      },
      unlinkSync: async (path) => {
        fs_unlinkSync_spy(path)
      }
    }

    const download = pkg.createDownload(params, ipfsCallsMock, generateMock, validateMock, fsMock)


    download({
      name: PACKAGE_NAME,
      manifest: dnpManifest
    })

    // generate_Manifest_spy - dnpManifest
    it('generate.Manifest should be called with dnpManifest', () => {
      sinon.assert.calledWith(generate_Manifest_spy, dnpManifest);
    });

    // generate_DockerCompose_spy - dnpManifest
    it('generate.DockerCompose should be called with dnpManifest', () => {
      expect(generate_DockerCompose_spy.getCalls()[0].args)
        .to.deep.equal( [dnpManifest] )
    });

    // fs_writeFileSync_spy - DockerCompose, DOCKERCOMPOSE_PATH
    it('fs.writeFileSync should be called FIRST with DockerCompose, MANIFEST_PATH', () => {
      expect(fs_writeFileSync_spy.getCalls()[0].args)
        .to.deep.equal( [MANIFEST_PATH, Manifest] )
    });

    it('fs.writeFileSync should be called SECOND with DockerCompose, DOCKERCOMPOSE_PATH', () => {
      expect(fs_writeFileSync_spy.getCalls()[1].args)
        .to.deep.equal( [DOCKERCOMPOSE_PATH, DockerCompose] )
    });

    // fs_existsSync_spy - IMAGE_PATH
    it('fs.existsSync should be called with IMAGE_PATH', () => {
      sinon.assert.calledWith(fs_existsSync_spy, IMAGE_PATH);
    });

    // ipfs_isfileHashValid_spy - IMAGE_HASH, IMAGE_PATH
    it('ipfs.isfileHashValid should be called with IMAGE_HASH, IMAGE_PATH', () => {
      expect(ipfs_isfileHashValid_spy.getCalls()[0].args)
        .to.deep.equal( [IMAGE_HASH, IMAGE_PATH] )
    });

    // fs_unlinkSync_spy - IMAGE_PATH
    it('fs.unlinkSync should be called with IMAGE_PATH', () => {
      sinon.assert.calledWith(fs_unlinkSync_spy, IMAGE_PATH);
    });

    // ipfs_download_spy - IMAGE_HASH, IMAGE_PATH
    it('ipfs.download should be called with IMAGE_HASH, IMAGE_PATH', () => {
      sinon.assert.calledWith(ipfs_download_spy, IMAGE_PATH, IMAGE_HASH);
    });

  })


  describe('.run', () => {

    /////// Make mocks for dependencies

    // dockerCompose .loadImage .up
    const dockerCompose_loadImage_spy = sinon.spy()
    const dockerCompose_up_spy = sinon.spy()
    const dockerComposeMock = {
      loadImage: dockerCompose_loadImage_spy,
      up: dockerCompose_up_spy
    }

    // getManifest
    const getManifest_spy = sinon.spy()

    const run = pkg.createRun(params, dockerComposeMock)

    run({
      name: PACKAGE_NAME,
      manifest: dnpManifest
    })

    it('dockerCompose.loadImage should be called with IMAGE_PATH', () => {
      expect(dockerCompose_loadImage_spy.getCalls()[0].args)
        .to.deep.equal( [IMAGE_PATH] )
    });

    // generate_DockerCompose_spy - dnpManifest
    it('dockerCompose.up should be called with DOCKERCOMPOSE_PATH', () => {
      expect(dockerCompose_up_spy.getCalls()[0].args)
        .to.deep.equal( [DOCKERCOMPOSE_PATH] )
    });

  })
})




function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
