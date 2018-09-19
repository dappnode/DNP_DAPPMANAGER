const proxyquire = require('proxyquire');
const chai = require('chai');
const expect = require('chai').expect;
const fs = require('fs');
const getPath = require('utils/getPath');
const validate = require('utils/validate');

chai.should();

describe('Call function: removePackage', function() {
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
  const params = {
    REPO_DIR: 'test_files/',
    DOCKERCOMPOSE_NAME: 'docker-compose.yml',
  };

  let hasRemoved = false;
  const PACKAGE_NAME = 'test.dnp.dappnode.eth';
  const docker = {
    compose: {
      down: async (path) => {
        hasRemoved = true;
      },
    },
  };

  const removePackage = proxyquire('calls/removePackage', {
    'modules/docker': docker,
    'params': params,
  });

  before(() => {
    const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
    validate.path(DOCKERCOMPOSE_PATH);
    fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeTemplate);
  });

  let res;
  it('should stop the package with correct arguments', async () => {
    res = await removePackage({id: PACKAGE_NAME});
    expect(hasRemoved).to.be.true;
  });

  it('should return a stringified object containing success', async () => {
    expect(res).to.be.ok;
    expect(res).to.have.property('message');
  });

  it('should throw an error with wrong package name', async () => {
    let error = '--- removePackage did not throw ---';
    try {
      await removePackage({id: PACKAGE_NAME});
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include('No docker-compose found');
  });
}
