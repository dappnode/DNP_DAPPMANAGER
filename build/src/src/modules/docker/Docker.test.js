const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const sinon = require('sinon');

const dockerUtils = require('./dockerUtils');

describe('docker calls', function() {
  describe('argument test', function() {
    const execSpy = sinon.spy();
    const docker = proxyquire('./Docker', {
      'utils/shell': execSpy,
    });
    const packageName = 'myPackage';
    const imagePath = './myImage';

    it('.up should call docker/compose with correct arguments', () => {
      docker.compose.up(packageName);
      sinon.assert.calledWith(execSpy, 'docker-compose -f '+packageName+' up -d');
    });

    it('.stop should call docker/compose with correct arguments', () => {
      docker.compose.stop(packageName, {timeout: 0});
      sinon.assert.calledWith(execSpy, 'docker-compose -f '+packageName+' stop --timeout 0');
    });

    it('.start should call docker/compose with correct arguments', () => {
      docker.compose.start(packageName);
      sinon.assert.calledWith(execSpy, 'docker-compose -f '+packageName+' start');
    });

    it('.down should call docker/compose with correct arguments', () => {
      docker.compose.down(packageName, {timeout: 0});
      sinon.assert.calledWith(execSpy, 'docker-compose -f '+packageName+' down --timeout 0');
    });

    it('.log should call docker/compose with correct arguments', () => {
      docker.compose.logs(packageName, {timestamps: true});
      sinon.assert.calledWith(execSpy, 'docker-compose -f '+packageName+' logs --timestamps 2>&1');
    });

    it('.loadImage should call REGULAR DOCKER with correct arguments', () => {
      docker.load(imagePath);
      sinon.assert.calledWith(execSpy, 'docker load -i ' + imagePath);
    });
  });

  if (process.env.TEST_INTEGRATION == 'true') {
    integrationTest();
  }
});

function integrationTest() {
  const docker = require('./docker');

  describe('integration test', function() {
    const path = 'test/docker-compose.yml';
    const containerName = 'DNP_DAPPMANAGER_TEST_CONTAINER';

    before(async function() {
      await docker.compose.down(path, {timeout: 0});
    });

    describe('up', function() {
      it('should call docker.compose.up successfully', (done) => {
        docker.compose.up(path, {timeout: 0})
        .then((res) => {
          expect(res).to.be.equal('');
          done();
        });
      }).timeout(20*1000);

      let dockerPsOutput;
      it('should call docker.compose.ps successfully', async () => {
        dockerPsOutput = await docker.compose.ps(path);
        expect(dockerPsOutput).to.be.a('string');
      });

      it('verify container state, it should be up', () => {
        let containers = dockerUtils.parsePs(dockerPsOutput);
        let container = containers.find((c) => c.name == containerName);
        expect(container.state).to.include('Up');
      });
    });

    describe('stop', function() {
      it('should call docker.compose.up successfully', (done) => {
        docker.compose.stop(path, {timeout: 0})
        .then((res) => {
          expect(res).to.be.equal('');
          done();
        });
      }).timeout(20*1000);

      let dockerPsOutput;
      it('should call docker.compose.ps successfully', async () => {
        dockerPsOutput = await docker.compose.ps(path);
        expect(dockerPsOutput).to.be.a('string');
      });

      it('verify container state, it should be exited', () => {
        let containers = dockerUtils.parsePs(dockerPsOutput);
        let container = containers.find((c) => c.name == containerName);
        expect(container.state).to.include('Exit');
      });
    });

    describe('start', function() {
      it('should call docker.compose.start successfully', async () => {
        let res = await docker.compose.start(path);
        expect(res).to.be.equal('');
      });

      let dockerPsOutput;
      it('should call docker.compose.ps successfully', async () => {
        dockerPsOutput = await docker.compose.ps(path);
        expect(dockerPsOutput).to.be.a('string');
      });

      it('verify container state, it should be up again', () => {
        let containers = dockerUtils.parsePs(dockerPsOutput);
        let container = containers.find((c) => c.name == containerName);
        expect(container.state).to.include('Up');
      });
    });

    describe('down', function() {
      it('should call docker.compose.down successfully', async () => {
        let res = await docker.compose.down(path, {timeout: 0});
        expect(res).to.be.equal('');
      });

      let dockerPsOutput;
      it('should call docker.compose.ps successfully', async () => {
        dockerPsOutput = await docker.compose.ps(path);
        expect(dockerPsOutput).to.be.a('string');
      });

      it('verify container state, it should be down', () => {
        let containers = dockerUtils.parsePs(dockerPsOutput);
        let container = containers.find((c) => c.name.includes(containerName));
        expect(container).to.be.undefined;
      });
    });
  });
}
