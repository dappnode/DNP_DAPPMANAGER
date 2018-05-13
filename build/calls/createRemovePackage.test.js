const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')
const fs = require('fs')
const createRemovePackage = require('./createRemovePackage')

chai.should();

describe('Call function: removePackage', function() {

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

    let hasRemoved = false
    const PACKAGE_NAME = 'test.dnp.dappnode.eth'
    const docker_composeMock = {
      down: async (path) => {
        hasRemoved = true
      }
    }

    const removePackage = createRemovePackage(params, docker_composeMock)

    it('should stop the package with correct arguments', async () => {
      await removePackage([PACKAGE_NAME])
      expect(hasRemoved).to.be.true;
    })

    it('should throw an error with wrong package name', async () => {
      let error = '--- removePackage did not throw ---'
      try {
        await removePackage(['anotherPackage.dnp.eth'])
      } catch(e) {
        error = e.message
      }
      expect(error).to.include('No docker-compose found')
    })

    it('should return a stringified object containing success', async () => {
      let res = await removePackage([PACKAGE_NAME])
      expect(JSON.parse(res)).to.deep.include({
        success: true
      });
    });

  })
}
