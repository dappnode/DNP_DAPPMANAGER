const assert = require('assert');
const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const createLogPackage = require('./createLogPackage');
const getPath = require('../utils/getPath');
const validate = require('../utils/validate');

chai.should();

describe('Call function: logPackage', function() {
  mockTest();
});


function mockTest() {
  describe('mock test', function() {
    // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params)
    const STOP_MSG = 'stopped package';
    const START_MSG = 'started package';

    const params = {
      REPO_DIR: 'test/',
      DOCKERCOMPOSE_NAME: 'docker-compose.yml',
    };

    let hasLogged = false;
    const PACKAGE_NAME = 'test.dnp.dappnode.eth';
    const dockerMock = {
      compose: {
        logs: async (path) => {
          hasLogged = true;
          return 'LOGS';
        },
      },
    };

    const logPackage = createLogPackage(params, dockerMock);

    before(() => {
      const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
      validate.path(DOCKERCOMPOSE_PATH);
      fs.writeFileSync(DOCKERCOMPOSE_PATH, `version: '3.4'
      services:
          otpweb.dnp.dappnode.eth:
              image: 'chentex/random-logger:latest'
              container_name: DNP_DAPPMANAGER_TEST_CONTAINER`);
    });

    it('should log the package with correct arguments', async () => {
      let res = await logPackage([PACKAGE_NAME]);
      expect(hasLogged).to.be.true;
    });

    it('should throw an error with wrong package name', async () => {
      let error = '--- logPackage did not throw ---';
      try {
        await logPackage(['anotherPackage.dnp.eth']);
      } catch (e) {
        error = e.message;
      }
      expect(error).to.include('No docker-compose found');
    });

    it('should return a stringified object containing logs', async () => {
      let res = await logPackage([PACKAGE_NAME]);
      expect(JSON.parse(res)).to.deep.include({
        success: true,
        result: {
          name: PACKAGE_NAME,
          logs: 'LOGS',
        },
      });
    });
  });
}
