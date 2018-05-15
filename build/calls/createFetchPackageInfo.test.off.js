const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')
const fs = require('fs')
const createFetchPackageInfo = require('./createFetchPackageInfo')

chai.should();

describe('Call function: logPackage', function() {

  docker_composeMockTest()

});


function docker_composeMockTest() {
  describe('mock test', function() {

    // const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
    const STOP_MSG = 'stopped package'
    const START_MSG = 'started package'

    const params = {
      REPO_DIR: 'test/',
      DOCKERCOMPOSE_NAME: 'docker-compose.yml'
    }

    let hasLogged = false
    const PACKAGE_NAME = 'test.dnp.dappnode.eth'
    const docker_composeMock = {
      logs: async (path) => {
        hasLogged = true
        return 'LOGS'
      }
    }

    const fetchPackageInfo = createFetchPackageInfo(params, docker_composeMock)

    it('should log the package with correct arguments', async () => {
      let res = await logPackage([PACKAGE_NAME])
      expect(hasLogged).to.be.true;
    })

    it('should throw an error with wrong package name', async () => {
      let error = '--- logPackage did not throw ---'
      try {
        await logPackage(['anotherPackage.dnp.eth'])
      } catch(e) {
        error = e.message
      }
      expect(error).to.include('No docker-compose found')
    })

    it('should return a stringified object containing logs', async () => {
      let res = await logPackage([PACKAGE_NAME])
      expect(JSON.parse(res)).to.deep.include({
        success: true,
        result: 'LOGS'
      });
    });

  })
}
