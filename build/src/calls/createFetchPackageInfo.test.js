const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')
const fs = require('fs')
const pauseSync = require('../utils/pauseSync')
const {
  createFetchPackageInfo,
  createGetManifestOfVersions,
  createGetPackageVersions
} = require('./createFetchPackageInfo')

chai.should();

describe('Call function: fetchPackageInfo', function() {

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

  // initialize dependencies
  const web3 = web3Setup(params) // <-- web3
  validate.web3(web3)
  const apm = createAPM(web3)
  const getManifest = createGetManifest(apm, ipfsCalls)
  const fetchPackageInfo = createFetchPackageInfo(getManifest, apm)

  describe('[INTEGRATION TEST] Call function fetchPackageInfo', () => {

    const packageReq = 'otpweb.dnp.dappnode.eth'
    let res;

    it('should return a stringified response', async () => {
      res = await fetchPackageInfo([packageReq])
      expect( res ).to.be.a('string')
    })

    it('should return success', async () => {
      let parsedRes = JSON.parse(res)
      expect( parsedRes.success ).to.be.true
    })

    it('should return a valid list of packages', async () => {
      let parsedRes = JSON.parse(res)
      expect(parsedRes.result.name).to.equal(packageReq)
      expect(parsedRes.result.versions).to.be.an('array')
    })

    it('should return a manifests attached to each version', async () => {
      let parsedRes = JSON.parse(res)
      expect(parsedRes.result.versions[2].manifest.name).to.equal(packageReq)
    })
  })

}


function mockTest() {

  const packageName = 'myPackage'
  const packageReq = {name: packageName, ver: 'latest'}
  const versions = [
    {version: '0.0.1'},
    {version: '0.0.2'}
  ]
  const apm_getRepoVersion_spy = sinon.spy()
  const apm_mock = {
    getRepoVersions: async (packageName) => {
      apm_getRepoVersion_spy(packageName)
      return versions
    }
  }

  const ERROR_MESSAGE = 'no manifest'
  const getManifest_spy = sinon.spy()
  const getManifest_mock = async (packageReq) => {
    getManifest_spy(packageReq)
    if (packageReq.ver == '0.0.1') return 'manifest_0.0.1'
    if (packageReq.ver == '0.0.2') throw Error(ERROR_MESSAGE)
  }

  const getPackageVersions = createGetPackageVersions(apm_mock)
  const getManifestOfVersions = createGetManifestOfVersions(getManifest_mock)
  const fetchPackageInfo = createFetchPackageInfo(getManifest_mock, apm_mock)

  describe('helper function createGetPackageVersions', function() {

    it('should call apm.getRepoVersions with packageName', async () => {
      let res = await getPackageVersions(packageReq)
      expect(res)
        .to.deep.equal({
          name: packageName,
          versions: versions.reverse()
        })
    })

    it('should log the package with correct arguments', async () => {
      expect(apm_getRepoVersion_spy.getCalls()[0].args)
        .to.deep.equal( [packageReq] )
    })

  })


  describe('helper function createGetManifestOfVersions', function() {

    it('should return nothing, undefined', async () => {
      let res = await getManifestOfVersions(packageReq, versions)
      expect(res)
        .to.be.undefined
    })

    it('getManifest should be called twice with two different versions (0.0.1)', () => {
      expect(getManifest_spy.getCalls()[0].args)
        .to.deep.equal( [{
          name: packageName,
          ver: '0.0.1'
        }] )
    })
    it('getManifest should be called twice with two different versions (0.0.2)', () => {
      expect(getManifest_spy.getCalls()[1].args)
        .to.deep.equal( [{
          name: packageName,
          ver: '0.0.2'
        }] )
    })

    it('the versions array should be extended on place, adding manifests', () => {
      expect(versions[0])
        .to.deep.equal( {version: '0.0.1', manifest: 'manifest_0.0.1'} )
    })

    it('the versions array should be extended even if fetching a manifest fails', () => {
      expect(versions[1].manifest.error)
        .to.be.true
    })

  })


  describe('Call function fetchPackageInfo', function() {

    it('should return success message and packageWithVersions', async () => {

      let res = await fetchPackageInfo([packageName])

      const expected_result = {
        "success": true,
        "result": {
          "name": packageName,
          "versions": [
            {
              "version": "0.0.2",
              "manifest": {error: true}
            },
            {
              "version": "0.0.1",
              "manifest": "manifest_0.0.1"
            }
          ]
        }
      }

      let parsedRes = JSON.parse(res)
      expect( parsedRes.success ).to.be.true
      expect( parsedRes.result.name ).to.equal(packageName)

      let versions = parsedRes.result.versions
      expect( versions.length ).to.equal(2)
      expect( versions[0].manifest.error ).to.be.true
      expect( versions[1].manifest ).to.equal("manifest_0.0.1")

    })
  })
}
