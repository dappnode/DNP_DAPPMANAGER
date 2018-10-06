const proxyquire = require('proxyquire');
const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const getPath = require('../../src/utils/getPath');
const validate = require('../../src/utils/validate');
const docker = require('../../src/modules/docker');
const parse = require('../../src/utils/parse');

chai.should();

describe('Call function: restartPackageVolumes', function() {
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

  it('should remove the package volumes', async () => {
    // Mock docker
    sinon.replace(docker.volume, 'rm', sinon.fake());
    sinon.replace(docker.compose, 'rm', sinon.fake());
    sinon.replace(docker.compose, 'up', sinon.fake());
    // Mock parse
    const packageVolumes = ['vol1', 'vol2'];
    sinon.replace(parse, 'serviceVolumes', sinon.fake.returns(packageVolumes));

    /**
     * PROXYQUIRE
     */
    const restartPackageVolumes = proxyquire('calls/restartPackageVolumes', {
      '../utils/parse': parse,
      '../modules/docker': docker,
      '../params': params,
    });
    /**
     * PROXYQUIRE
     */

    let res = await restartPackageVolumes({id: PACKAGE_NAME});
    // sinon.assert.called(docker.compose.rm);
    sinon.assert.calledWith(docker.volume.rm.firstCall, 'vol1');
    sinon.assert.calledWith(docker.volume.rm.secondCall, 'vol2');
    sinon.assert.called(docker.compose.up);
    expect(res).to.be.ok;
    expect(res).to.have.property('message');
  });

  after(() => {
    fs.unlinkSync(DOCKERCOMPOSE_PATH);
  });
});
