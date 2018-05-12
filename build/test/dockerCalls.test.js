const assert = require('assert')
const sinon = require('sinon')

const { DockerManager } = require('../modules/calls/dockerCalls')

describe('docker-compose calls', function() {

  let execSpy = sinon.spy();

  let dockerManager = new DockerManager()
  dockerManager.setExec(execSpy)

  describe('up', function() {
    it('should call docker/compose with correct arguments', function(){
      let packageName = 'mypackage'
      dockerManager.up(packageName)
      assert(execSpy.calledWith('docker-compose -f '+packageName+' up -d'));
    });
  });
});
