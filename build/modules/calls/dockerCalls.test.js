const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')

const { Docker_compose } = require('./dockerCalls')
const dockerCallsUtils = require('./dockerCallsUtils')

describe('docker-compose calls', function() {

  argumentTest()

  if (process.env.TEST_INTEGRATION == 'true') {
    integrationTest()
  }

});

function argumentTest() {
  describe('argument test', function() {

    const packageName = 'myPackage'
    let execSpy = sinon.spy();

    let docker_compose_Spy = new Docker_compose()
    docker_compose_Spy.setExec(execSpy)

    it('.up should call docker/compose with correct arguments', function(){
      docker_compose_Spy.up(packageName)
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' up -d');
    });

    it('.stop should call docker/compose with correct arguments', function(){
      docker_compose_Spy.stop(packageName, {timeout: 0})
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' stop --timeout 0');
    });

    it('.start should call docker/compose with correct arguments', function(){
      docker_compose_Spy.start(packageName)
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' start');
    });

    it('.down should call docker/compose with correct arguments', function(){
      docker_compose_Spy.down(packageName, {timeout: 0})
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' down --timeout 0');
    });

    it('.log should call docker/compose with correct arguments', function(){
      docker_compose_Spy.logs(packageName, {timestamps: true})
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' logs --timestamps');
    });
  });
}


function integrationTest() {
  describe('integration test', function() {

    const path = 'test/docker-compose.yml'
    const container_name = 'DNP_INSTALLER_TEST_CONTAINER'

    let docker_compose = new Docker_compose()

    before(async function() {
      await docker_compose.down(path, {timeout: 0})
    });

    describe('up', function() {

      it('should call docker_compose.up successfully', async () => {
        let res = await docker_compose.up(path)
        expect(res).to.be.equal('')
      });

      let dockerPsOutput;
      it('should call docker_compose.ps successfully', async () => {
        dockerPsOutput = await docker_compose.ps(path)
        expect(dockerPsOutput).to.be.a('string')
      });

      it('verify container state, it should be up', function(){
        let containers = dockerCallsUtils.parsePs(dockerPsOutput)
        let container = containers.find(c => c.name == container_name)
        expect(container.state).to.include('Up')
      })

    });

    describe('stop', function() {

      it('should call docker_compose.up successfully', async () => {
        let res = await docker_compose.stop(path, {timeout: 0})
        expect(res).to.be.equal('')
      });

      let dockerPsOutput;
      it('should call docker_compose.ps successfully', async () => {
        dockerPsOutput = await docker_compose.ps(path)
        expect(dockerPsOutput).to.be.a('string')
      });

      it('verify container state, it should be exited', function(){
        let containers = dockerCallsUtils.parsePs(dockerPsOutput)
        let container = containers.find(c => c.name == container_name)
        expect(container.state).to.include('Exit')
      })

    });

    describe('start', function() {

      it('should call docker_compose.start successfully', async () => {
        let res = await docker_compose.start(path)
        expect(res).to.be.equal('')
      });

      let dockerPsOutput;
      it('should call docker_compose.ps successfully', async () => {
        dockerPsOutput = await docker_compose.ps(path)
        expect(dockerPsOutput).to.be.a('string')
      });

      it('verify container state, it should be up again', function(){
        let containers = dockerCallsUtils.parsePs(dockerPsOutput)
        let container = containers.find(c => c.name == container_name)
        expect(container.state).to.include('Up')
      })

    });

    describe('down', function() {

      it('should call docker_compose.down successfully', async () => {
        let res = await docker_compose.down(path, {timeout: 0})
        expect(res).to.be.equal('')
      });

      let dockerPsOutput;
      it('should call docker_compose.ps successfully', async () => {
        dockerPsOutput = await docker_compose.ps(path)
        expect(dockerPsOutput).to.be.a('string')
      });

      it('verify container state, it should be down', function(){
        let containers = dockerCallsUtils.parsePs(dockerPsOutput)
        let container = containers.find(c => c.name.includes(container_name))
        expect(container).to.be.undefined;
      })
    });
  });
}
