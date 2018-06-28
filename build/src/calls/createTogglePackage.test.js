const chai = require('chai');
const expect = require('chai').expect;
const fs = require('fs');
const createTogglePackage = require('./createTogglePackage');
const getPath = require('../utils/getPath');
const validate = require('../utils/validate');

chai.should();

describe('Call function: togglePackage', function() {
  describe('mock test', mockTest);
});

const dockerComposeTemplate = (`
version: '3.4'
services:
    otpweb.dnp.dappnode.eth:
        image: 'chentex/random-logger:latest'
        container_name: DNP_DAPPMANAGER_TEST_CONTAINER
`).trim();


function mockTest() {
  // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params)

  const params = {
    REPO_DIR: 'test/',
    DOCKERCOMPOSE_NAME: 'docker-compose.yml',
  };

  let hasStopped = false;
  const PACKAGE_NAME = 'test.dnp.dappnode.eth';
  const args = [PACKAGE_NAME];
  const dockerMock = {
    compose: {
      ps: async (path) => {
        return (`
Name                        Command                 State             Ports
---------------------------------------------------------------------------------------------
${PACKAGE_NAME}          docker-entrypoint.sh mysqld      Up (healthy)  3306/tcp
`).trim();
      },
      stop: async (path) => {
        hasStopped = true;
      },
    },
  };

  const togglePackage = createTogglePackage(params, dockerMock);

  before(() => {
    const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
    validate.path(DOCKERCOMPOSE_PATH);
    fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeTemplate);
  });

  it('should stop the package with correct arguments', async () => {
    await togglePackage({args});
    expect(hasStopped).to.be.true;
  });

  it('should throw an error with wrong package name', async () => {
    let error = '--- togglePackage did not throw ---';
    try {
      await togglePackage({args: ['anotherPackage.dnp.eth']});
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include('No docker-compose found');
  });

  it('should return a stringified object containing success', async () => {
    let res = await togglePackage({args});
    expect(JSON.parse(res)).to.deep.include({
      success: true,
    });
  });
}
