const proxyquire = require('proxyquire');
const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const getPath = require('../../src/utils/getPath');
const validate = require('../../src/utils/validate');
const docker = require('../../src/modules/docker');

chai.should();

describe('Call function: restartPackage', function() {
  const params = {
    REPO_DIR: 'test_files/',
    DOCKERCOMPOSE_NAME: 'docker-compose.yml',
  };

  const PACKAGE_NAME = 'test.dnp.dappnode.eth';
  const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);

  before(() => {
    validate.path(DOCKERCOMPOSE_PATH);
    fs.writeFileSync(DOCKERCOMPOSE_PATH, 'docker-compose');
  });

  it('should restart the package', async () => {
    // Mock docker
    sinon.replace(docker.compose, 'rm_up', sinon.fake());

    /**
     * PROXYQUIRE
     */
    const restartPackage = proxyquire('calls/restartPackage', {
      '../modules/docker': docker,
      '../params': params,
    });
    /**
     * PROXYQUIRE
     */

    let res = await restartPackage({id: PACKAGE_NAME});
    // sinon.assert.called(docker.compose.rm);
    sinon.assert.calledWith(docker.compose.rm_up, DOCKERCOMPOSE_PATH);
    expect(res).to.be.ok;
    expect(res).to.have.property('message');
  });

  after(() => {
    fs.unlinkSync(DOCKERCOMPOSE_PATH);
  });
});
