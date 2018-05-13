const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')
const fs = require('fs')
const createTogglePackage = require('./createTogglePackage')

chai.should();

describe('Call function: togglePackage', function() {

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

    let hasStopped = false
    const PACKAGE_NAME = 'test.dnp.dappnode.eth'
    const docker_composeMock = {
      ps: async (path) => {
        return `Name                        Command                 State             Ports
        ---------------------------------------------------------------------------------------------
        ${PACKAGE_NAME}          docker-entrypoint.sh mysqld      Up (healthy)  3306/tcp
        `
      },
      stop: async (path) => {
        hasStopped = true
      },
    }

    const togglePackage = createTogglePackage(params, docker_composeMock)

    it('should stop the package with correct arguments', async () => {
      await togglePackage([PACKAGE_NAME])
      expect(hasStopped).to.be.true;
    });

    it('should throw an error with wrong package name', async () => {
      let error = '--- togglePackage did not throw ---'
      try {
        await togglePackage(['anotherPackage.dnp.eth'])
      } catch(e) {
        error = e.message
      }
      expect(error).to.include('No docker-compose found')
    });

    it('should return a stringified object containing success', async () => {
      let res = await togglePackage([PACKAGE_NAME])
      expect(JSON.parse(res)).to.deep.include({
        success: true
      });
    });

  });
}
