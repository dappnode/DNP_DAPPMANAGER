const chai = require('chai')
const expect = require('chai').expect
const { parseEnvFile, stringifyEnvs } = require('./parse')
const { parsePackageReq } = require('./parse')

chai.should();

const getPath = require('./getPath')

describe('Util: parse', function() {

  describe('parse and stringify envs', function() {
    const envs = {
      VAR1: 'VALUE1',
      VAR2: 'VALUE2'
    }
    const envString = 'VAR1=VALUE1\nVAR2=VALUE2'

    it('should stringify an envs object', function(){
      stringifyEnvs(envs)
        .should.equal(envString)
    });

    it('should parse an env string', function(){
      parseEnvFile(envString)
        .should.deep.equal(envs)
    });
  });

  describe('parse Package request', function() {

    it('should parse a package request', function(){

      parsePackageReq('package_name@version')
        .should.deep.equal({
          name: 'package_name',
          ver: 'version',
          req: 'package_name@version'
        })

    });

    it('should add latest to verionless requests', function(){

      parsePackageReq('package_name')
        .should.deep.equal({
          name: 'package_name',
          ver: 'latest',
          req: 'package_name@latest'
        })

    });
  });

});
