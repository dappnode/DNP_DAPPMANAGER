const chai = require('chai')
const sinon = require('sinon')
const packagesUtils = require('./packagesUtils')
const getPath = require('../utils/getPath')

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

  const runPackages = packagesUtils.createRunPackages(asyncFunction)
  const downloadPackages = packagesUtils.createDownloadPackages(asyncFunction)

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


  /////// Make mocks for dependecies

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
      Manifest: (dnpManifest) => {
        generate_Manifest_spy(dnpManifest)
        return 'Manifest'
      },
      DockerCompose: (dnpManifest) => {
        generate_DockerCompose_spy(dnpManifest)
        return DockerCompose
      }
    }

    const getManifest_spy = sinon.spy()
    const getManifestMock = (name) => {
      getManifest_spy(name)
      return dnpManifest
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

    const download = packagesUtils.createDownload(params, ipfsCallsMock, getManifestMock, generateMock, fsMock)


    download({name: PACKAGE_NAME})

    it('getManifest should be called with PACKAGE_NAME', function(){
      expect(getManifest_spy.getCalls()[0].args)
        .to.deep.equal( [PACKAGE_NAME] )
    });

    // generate_Manifest_spy - dnpManifest
    it('generate.Manifest should be called with dnpManifest', function(){
      sinon.assert.calledWith(generate_Manifest_spy, dnpManifest);
    });

    // generate_DockerCompose_spy - dnpManifest
    it('generate.DockerCompose should be called with dnpManifest', function(){
      expect(generate_DockerCompose_spy.getCalls()[0].args)
        .to.deep.equal( [dnpManifest] )
    });

    // fs_writeFileSync_spy - DockerCompose, DOCKERCOMPOSE_PATH
    it('fs.writeFileSync should be called FIRST with DockerCompose, MANIFEST_PATH', function(){
      expect(fs_writeFileSync_spy.getCalls()[0].args)
        .to.deep.equal( [Manifest, MANIFEST_PATH] )
    });

    it('fs.writeFileSync should be called SECOND with DockerCompose, DOCKERCOMPOSE_PATH', function(){
      expect(fs_writeFileSync_spy.getCalls()[1].args)
        .to.deep.equal( [DockerCompose, DOCKERCOMPOSE_PATH] )
    });

    // fs_existsSync_spy - IMAGE_PATH
    it('fs.existsSync should be called with IMAGE_PATH', function(){
      sinon.assert.calledWith(fs_existsSync_spy, IMAGE_PATH);
    });

    // ipfs_isfileHashValid_spy - IMAGE_HASH, IMAGE_PATH
    it('ipfs.isfileHashValid should be called with IMAGE_HASH, IMAGE_PATH', function(){
      expect(ipfs_isfileHashValid_spy.getCalls()[0].args)
        .to.deep.equal( [IMAGE_HASH, IMAGE_PATH] )
    });

    // fs_unlinkSync_spy - IMAGE_PATH
    it('fs.unlinkSync should be called with IMAGE_PATH', function(){
      sinon.assert.calledWith(fs_unlinkSync_spy, IMAGE_PATH);
    });

    // ipfs_download_spy - IMAGE_HASH, IMAGE_PATH
    it('ipfs.download should be called with IMAGE_HASH, IMAGE_PATH', function(){
      sinon.assert.calledWith(ipfs_download_spy, IMAGE_HASH, IMAGE_PATH);
    });

  })


  describe('.download', () => {

    /////// Make mocks for dependecies

    // dockerCalls .loadImage
    const dockerCalls_loadImage_spy = sinon.spy()
    const dockerCallsMock = {
      loadImage: dockerCalls_loadImage_spy
    }

    // docker_compose .up
    const docker_compose_up_spy = sinon.spy()
    const docker_composeMock = {
      up: docker_compose_up_spy
    }

    // getManifest
    const getManifest_spy = sinon.spy()
    const getManifestMock = (name) => {
      getManifest_spy(name)
      return dnpManifest
    }

    const run = packagesUtils.createRun(params, getManifestMock, dockerCallsMock, docker_composeMock)

    run({name: PACKAGE_NAME})

    it('getManifest should be called with PACKAGE_NAME', function(){
      expect(getManifest_spy.getCalls()[0].args)
        .to.deep.equal( [PACKAGE_NAME] )
    });

    it('dockerCalls.loadImage should be called with IMAGE_PATH', function(){
      expect(dockerCalls_loadImage_spy.getCalls()[0].args)
        .to.deep.equal( [IMAGE_PATH] )
    });

    // generate_DockerCompose_spy - dnpManifest
    it('docker_compose.up should be called with DOCKERCOMPOSE_PATH', function(){
      expect(docker_compose_up_spy.getCalls()[0].args)
        .to.deep.equal( [DOCKERCOMPOSE_PATH] )
    });

  })
})




function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
