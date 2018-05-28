const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')
const fs = require('fs')
const createInstallPackage = require('./createInstallPackage')

chai.should();

describe('Call function: installPackage', function() {

  mockTest()
  // integrationTest()

});


function integrationTest() {
  const params = require('../params')
  const createGetManifest = require('../utils/getManifest')
  const createAPM = require('../modules/apm')
  const ipfsCalls = require('../modules/ipfsCalls')
  const web3Setup = require('../modules/web3Setup')
  const validate = require('../utils/validate')
  const dependencies = require('../utils/dependencies')
  const pkg = require('../utils/packages')
  const createDocker = require('../utils/Docker')

  // initialize dependencies
  const web3 = web3Setup(params) // <-- web3
  validate.web3(web3)
  const apm = createAPM(web3)
  const docker = createDocker()

  // Construct getDependencies
  const getManifest = createGetManifest(apm, ipfsCalls)
  const getDependencies = dependencies.createGetAllResolvedOrdered(getManifest)

  // Construct single package downloader and runner
  const download = pkg.createDownload(params, ipfsCalls)
  const run      = pkg.createRun(params, docker)
  const downloadPackages = pkg.createDownloadPackages(download)
  const runPackages      = pkg.createRunPackages(run)

  const installPackage = createInstallPackage  (getDependencies, downloadPackages, runPackages)

  describe('[INTEGRATION TEST] Call function installPackage', () => {

    const packageReq = 'otpweb.dnp.dappnode.eth'
    let res;

    it('should run successfully', async (done) => {
      let error
      try {
        res = await installPackage([packageReq])
      } catch(e) {
        console.error(e)
        error = e
      }
      expect( error ).to.be.undefined
    }).timeout(10*1000)

    it('should return a stringified response', async () => {
      expect( res ).to.be.a('string')
    })

    it('should return success', async () => {
      let parsedRes = JSON.parse(res)
      expect( parsedRes.success ).to.be.true
    })

    // it('should return a valid list of packages', async () => {
    //   let parsedRes = JSON.parse(res)
    //   expect(parsedRes.result.name).to.equal(packageReq)
    //   expect(parsedRes.result.versions).to.be.an('array')
    // })
    //
    // it('should return a manifests attached to each version', async () => {
    //   let parsedRes = JSON.parse(res)
    //   expect(parsedRes.result.versions[2].manifest.name).to.equal(packageReq)
    // })
  })

}


function mockTest() {
  describe('mock test', function() {

    // const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
    const ipfs_download_spy = sinon.spy()
    const STOP_MSG = 'stopped package'
    const START_MSG = 'started package'

    const params = {
      REPO_DIR: 'test/',
      DOCKERCOMPOSE_NAME: 'docker-compose.yml'
    }
    const packageList = ['a']
    const PACKAGE_NAME = 'packageA'
    // Create Mocks
    const downloadPackages_spy = sinon.spy()
    const downloadPackages_Mock = async (packageList) => {
      downloadPackages_spy(packageList)
    }
    const runPackages_spy = sinon.spy()
    const runPackages_Mock = async (packageList) => {
      runPackages_spy(packageList)
    }
    const getAllDependenciesResolvedOrdered_spy = sinon.spy()
    const getAllDependenciesResolvedOrdered_Mock = async (packageReq) => {
      getAllDependenciesResolvedOrdered_spy(packageReq)
      return packageList
    }

    const installPackage = createInstallPackage(getAllDependenciesResolvedOrdered_Mock,
      downloadPackages_Mock,
      runPackages_Mock)

    let res

    it('downloadPackages should be called with packageList', async () => {

      // Call only once for efficiency
      res = await installPackage([PACKAGE_NAME])

      expect(downloadPackages_spy.getCalls()[0].args)
        .to.deep.equal( [packageList] )
    });

    it('runPackages should be called with packageList', () => {
      expect(runPackages_spy.getCalls()[0].args)
        .to.deep.equal( [packageList] )
    });

    // it('should stop the package with correct arguments', async () => {
    //   await removePackage([PACKAGE_NAME])
    //   expect(hasRemoved).to.be.true;
    // })

    // it('should throw an error with wrong package name', async () => {
    //   let error = '--- removePackage did not throw ---'
    //   try {
    //     await removePackage(['anotherPackage.dnp.eth'])
    //   } catch(e) {
    //     error = e.message
    //   }
    //   expect(error).to.include('No docker-compose found')
    // })

    it('should return a stringified object containing success', async () => {
      expect(JSON.parse(res)).to.deep.include({
        success: true
      });
    });

  })
}
