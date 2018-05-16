const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')
const shell = require('shelljs')
const fs = require('fs')
const getPath = require('../utils/getPath')
const { stringifyEnvs } = require('../utils/parse')
const createListPackages = require('./createListPackages')

chai.should();

describe('Call function: listPackages', function() {

  mockTest()

});


function mockTest() {

  let hasListed = false
  let envs = {VAR1: 'VALUE1'}
  let mockList = [
    {
      name: 'test.dnp.dappnode.eth'
    }
  ]
  // Result should extend the package list with the env variables
  let expected_result = [Object.assign({envs}, mockList[0])]

  // Mock docker calls
  const dockerCalls = {
    listContainers: async (path) => {
      hasListed = true
      return mockList
    }
  }

  // Mock params
  const params = {
    REPO_DIR: 'test/',
    DOCKERCOMPOSE_NAME: 'docker-compose.yml',
    ENV_FILE_EXTENSION: '.env'
  }

  // initialize call
  const listPackage = createListPackages(params, dockerCalls)

  before(() => {

    // Write mock data on the test folder
    const ENV_PATH = getPath.ENV_FILE(mockList[0].name, params)
    shell.mkdir('-p', getParentDir(ENV_PATH))
    fs.writeFileSync(ENV_PATH, stringifyEnvs(envs))

  })

  describe('mock test', function() {

    it('should list packages with correct arguments', async () => {
      let res = await listPackage()
      expect(hasListed).to.be.true;
    })

    it('should return a stringified object containing lists', async () => {
      let res = await listPackage()
      expect(JSON.parse(res)).to.deep.include({
        success: true,
        result: expected_result
      });
    });

  })
}


function getParentDir(fullPath) {
  return fullPath.replace(/\/[^\/]+$/, '')
}
