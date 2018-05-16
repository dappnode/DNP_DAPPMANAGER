const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')

const DockerCompose = require('./DockerCompose')
const dockerUtils = require('./dockerUtils')

describe('docker-compose calls', function() {

  argumentTest()

  if (process.env.TEST_INTEGRATION == 'true') {
    integrationTest()
  }

});

function argumentTest() {
  describe('argument test', function() {

    const packageName = 'myPackage'
    const imagePath = './myImage'
    let execSpy = sinon.spy();

    let dockerCompose_Spy = new DockerCompose()
    dockerCompose_Spy.setExec(execSpy)

    it('.up should call docker/compose with correct arguments', () => {
      dockerCompose_Spy.up(packageName)
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' up -d');
    });

    it('.stop should call docker/compose with correct arguments', () => {
      dockerCompose_Spy.stop(packageName, {timeout: 0})
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' stop --timeout 0');
    });

    it('.start should call docker/compose with correct arguments', () => {
      dockerCompose_Spy.start(packageName)
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' start');
    });

    it('.down should call docker/compose with correct arguments', () => {
      dockerCompose_Spy.down(packageName, {timeout: 0})
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' down --timeout 0');
    });

    it('.log should call docker/compose with correct arguments', () => {
      dockerCompose_Spy.logs(packageName, {timestamps: true})
      sinon.assert.calledWith(execSpy,'docker-compose -f '+packageName+' logs --timestamps');
    });

    it('.loadImage should call REGULAR DOCKER with correct arguments', () => {
      dockerCompose_Spy.loadImage(imagePath)
      sinon.assert.calledWith(execSpy,'docker load -i ' + imagePath);
    });
  });
}


function integrationTest() {
  describe('integration test', function() {

    const path = 'test/docker-compose.yml'
    const container_name = 'DNP_INSTALLER_TEST_CONTAINER'

    let dockerCompose = new DockerCompose()

    before(async function() {
      await dockerCompose.down(path, {timeout: 0})
    });

    describe('up', function() {

      it('should call dockerCompose.up successfully', async () => {
        let res = await dockerCompose.up(path)
        expect(res).to.be.equal('')
      });

      let dockerPsOutput;
      it('should call dockerCompose.ps successfully', async () => {
        dockerPsOutput = await dockerCompose.ps(path)
        expect(dockerPsOutput).to.be.a('string')
      });

      it('verify container state, it should be up', () => {
        let containers = dockerUtils.parsePs(dockerPsOutput)
        let container = containers.find(c => c.name == container_name)
        expect(container.state).to.include('Up')
      })

    });

    describe('stop', function() {

      it('should call dockerCompose.up successfully', async () => {
        let res = await dockerCompose.stop(path, {timeout: 0})
        expect(res).to.be.equal('')
      });

      let dockerPsOutput;
      it('should call dockerCompose.ps successfully', async () => {
        dockerPsOutput = await dockerCompose.ps(path)
        expect(dockerPsOutput).to.be.a('string')
      });

      it('verify container state, it should be exited', () => {
        let containers = dockerUtils.parsePs(dockerPsOutput)
        let container = containers.find(c => c.name == container_name)
        expect(container.state).to.include('Exit')
      })

    });

    describe('start', function() {

      it('should call dockerCompose.start successfully', async () => {
        let res = await dockerCompose.start(path)
        expect(res).to.be.equal('')
      });

      let dockerPsOutput;
      it('should call dockerCompose.ps successfully', async () => {
        dockerPsOutput = await dockerCompose.ps(path)
        expect(dockerPsOutput).to.be.a('string')
      });

      it('verify container state, it should be up again', () => {
        let containers = dockerUtils.parsePs(dockerPsOutput)
        let container = containers.find(c => c.name == container_name)
        expect(container.state).to.include('Up')
      })

    });

    describe('down', function() {

      it('should call dockerCompose.down successfully', async () => {
        let res = await dockerCompose.down(path, {timeout: 0})
        expect(res).to.be.equal('')
      });

      let dockerPsOutput;
      it('should call dockerCompose.ps successfully', async () => {
        dockerPsOutput = await dockerCompose.ps(path)
        expect(dockerPsOutput).to.be.a('string')
      });

      it('verify container state, it should be down', () => {
        let containers = dockerUtils.parsePs(dockerPsOutput)
        let container = containers.find(c => c.name.includes(container_name))
        expect(container).to.be.undefined;
      })
    });
  });
}
