const assert = require('assert')
const chai = require('chai')
const sinon = require('sinon')
const fs = require('fs')

chai.should();

const { writeEnvs } = require('./fs')

describe('File system utils', function() {

  describe('write env variables', function() {
    it('should write a env object contents in a specific format', async function(){
      // Write the file
      let envs = {VAR1: 'value1', VAR2: 'value2'}
      let path = 'test/env_test_file.env'
      await writeEnvs(envs, path)
      // retrive and compare
      let data = fs.readFileSync(path, 'utf8')
      data.should.equal('VAR1=value1\nVAR2=value2')
    });
  });
});
