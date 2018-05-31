const chai = require('chai')

chai.should();

const getPath = require('./getPath')

describe('Util: get paths', function() {

  const REPO_PATH_MOCK = 'repo/'
  const params = {
    REPO_DIR: REPO_PATH_MOCK, // ### Temporary name for development
    DAPPNODE_PACKAGE_NAME: 'dappnode_package.json',
    DOCKERCOMPOSE_NAME: 'docker-compose.yml',
    ENV_FILE_EXTENSION: '.env',
  }

  const packageName = 'some_package'
  const imageName = 'some_image.tar.xz'

  it('return PACKAGE_REPO_DIR path', () => {
    getPath.PACKAGE_REPO_DIR(packageName, params)
      .should.equal(REPO_PATH_MOCK + packageName)
  });

  it('return MANIFEST path', () => {
    getPath.MANIFEST(packageName, params)
      .should.equal(REPO_PATH_MOCK + packageName + '/' + params.DAPPNODE_PACKAGE_NAME)
  });

  it('return DOCKERCOMPOSE path', () => {
    getPath.DOCKERCOMPOSE(packageName, params)
      .should.equal(REPO_PATH_MOCK + packageName + '/' + params.DOCKERCOMPOSE_NAME)
  });

  it('return ENV_FILE path', () => {
    getPath.ENV_FILE(packageName, params)
      .should.equal(REPO_PATH_MOCK + packageName + '/' + packageName + params.ENV_FILE_EXTENSION)
  });

  it('return IMAGE path', () => {
    getPath.IMAGE(packageName, imageName, params)
      .should.equal(REPO_PATH_MOCK + packageName + '/' + imageName)
  });


});
