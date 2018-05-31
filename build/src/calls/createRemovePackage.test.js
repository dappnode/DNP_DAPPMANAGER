const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')
const fs = require('fs')
const createRemovePackage = require('./createRemovePackage')
const getPath = require('../utils/getPath')
const validate = require('../utils/validate')

chai.should();

describe('Call function: removePackage', function() {

  mockTest()

});


function mockTest() {
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
    const dockerMock = {
      compose: {
        down: async (path) => {
          hasRemoved = true
        }
      }
    }

    const removePackage = createRemovePackage(params, dockerMock)

    before(() => {
      const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
      validate.path(DOCKERCOMPOSE_PATH)
      fs.writeFileSync(DOCKERCOMPOSE_PATH, `version: '3.4'
      services:
          otpweb.dnp.dappnode.eth:
              image: 'chentex/random-logger:latest'
              container_name: DNP_DAPPMANAGER_TEST_CONTAINER`)
    })

    let res
    it('should stop the package with correct arguments', async () => {
      res = await removePackage([PACKAGE_NAME])
      expect(hasRemoved).to.be.true;
    })

    it('should return a stringified object containing success', async () => {
      expect(JSON.parse(res)).to.deep.include({
        success: true
      });
    });

    it('should throw an error with wrong package name', async () => {
      let error = '--- removePackage did not throw ---'
      try {
        await removePackage(['anotherPackage.dnp.eth'])
      } catch(e) {
        error = e.message
      }
      expect(error).to.include('No docker-compose found')
    })

  })
}
