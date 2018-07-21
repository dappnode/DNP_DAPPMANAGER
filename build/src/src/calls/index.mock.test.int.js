const chai = require('chai');
const expect = require('chai').expect;
const fs = require('fs');
const yaml = require('yamljs');
const logs = require('../logs.js')(module);

chai.should();

describe('Full integration test with mock docker: ', function() {
  integrationTest();
});

// The test will perfom intense tasks and could take up to some minutes
// TEST - 1
// - > updatePackageEnv
// - > installPackage
// - > listPackages - > confirm success

// - > installPackage - > expect error (already installed)

// - > logPackage

// - > togglePackage (stop)
// - > listPackages - > confirm success

// - > togglePackage (start)
// - > listPackages - > confirm success

// - > removePackage
// - > listPackages - > confirm success

// TEST - 2
// - > listDirectory
// - > fetchPackageInfo


function integrationTest() {
  // import calls
  const createInstallPackage = require('./createInstallPackage');
  const createRemovePackage = require('./createRemovePackage');
  const createTogglePackage = require('./createTogglePackage');
  const createLogPackage = require('./createLogPackage');
  const createListPackages = require('./createListPackages');
  const createListDirectory = require('./createListDirectory');
  const {createFetchPackageInfo} = require('./createFetchPackageInfo');
  const createUpdatePackageEnv = require('./createUpdatePackageEnv');

  // Mock key dependencies
  let dockerContainers = [];
  const shellExec = async (command) => {
    if (command.startsWith('docker-compose')) {
      let subcommand = command.substr('docker-compose'.length);
      let parsedCommand = {};
      // Get the -f flag
      if (subcommand.includes(' -f ')) {
        parsedCommand.dockerFile = subcommand.split(' -f ')[1].split(' ')[0];
        subcommand.replace(' -f '+parsedCommand.dockerFile, '');
      }
      // Get the main command
      if (subcommand.includes(' up ')) parsedCommand.up = true;
      if (subcommand.includes(' down ')) parsedCommand.down = true;
      if (subcommand.includes(' start ')) parsedCommand.start = true;
      if (subcommand.includes(' stop ')) parsedCommand.stop = true;

      // >>>>> Execute action:
      let containerName = getConainerName(parsedCommand);
      // UP, add container
      if (parsedCommand.up) {
        dockerContainers.push({
          name: containerName,
          state: 'running',
        });
      }
      // DOWN, remove container
      if (parsedCommand.down) {
        dockerContainers.filter((e) => e.name !== containerName);
      }
      // START, change state to running
      if (parsedCommand.start) {
        let pkg = dockerContainers.find((e) => e.name === containerName);
        pkg.state = 'running';
      }
      // STOP, change state to running
      if (parsedCommand.stop) {
        let pkg = dockerContainers.find((e) => e.name === containerName);
        pkg.state = 'exited';
      }
    }
    const stdout = 'Everything work great';
    return stdout;
  };

  // Docker mock helper functions
  function getConainerName(parsedCommand) {
    if (parsedCommand.dockerFile) {
      let dcString = fs.readFileSync(parsedCommand.dockerFile, 'utf8');
      let dc = yaml.parse(dcString);
      let serviceName = Object.getOwnPropertyNames(dc.services)[0];
      return dc.services[serviceName].container_name;
    } else {
      throw Error('No docker-compose file was specified');
    }
  }

  const dockerListMock = {
    listContainers: async () => {
      return dockerContainers;
    },
  };

  // import dependencies
  const params = require('../params');
  const {createDocker} = require('../utils/Docker');
  const pkg = require('../utils/packages');
  const createGetManifest = require('../utils/getManifest');
  const dependencies = require('../utils/dependencies');
  const createGetDirectory = require('../modules/createGetDirectory');
  const createAPM = require('../modules/apm');
  const ipfsCallsFactory = require('../modules/ipfsCalls');
  const web3Setup = require('../modules/web3Setup');
  const ipfsSetup = require('../modules/ipfsSetup');

  // customize params:
  params.WEB3HOSTWS = 'wss://mainnet.infura.io/ws';
  params.IPFS = 'ipfs.infura.io';

  // initialize dependencies (by order)
  const web3 = web3Setup(params); // <-- web3
  const ipfs = ipfsSetup(params); // <-- ipfs
  const apm = createAPM(web3);
  const ipfsCalls = ipfsCallsFactory(ipfs);
  const getDirectory = createGetDirectory(web3);
  const getManifest = createGetManifest(apm, ipfsCalls);
  const docker = createDocker(shellExec);
  const getDependencies = dependencies.createGetAllResolvedOrdered(getManifest);
  const download = pkg.downloadFactory({params, ipfsCalls});
  const run = pkg.runFactory({params, docker});

  // Initialize calls
  const installPackage = createInstallPackage(getDependencies, download, run);
  const removePackage = createRemovePackage(params, docker);
  const togglePackage = createTogglePackage(params, docker);
  const logPackage = createLogPackage(params, docker);
  const listPackages = createListPackages(params, dockerListMock); // Needs work
  const listDirectory = createListDirectory(getDirectory);
  const fetchPackageInfo = createFetchPackageInfo(getManifest, apm);
  const updatePackageEnv = createUpdatePackageEnv(params, docker);

  const packageReq = 'otpweb.dnp.dappnode.eth';

  // add .skip to skip test
  describe('TEST 1, install package, log, toggle twice and delete it', async () => {
    // - > updatePackageEnv (without restart, preinstall)
    testUpdatePackageEnv(updatePackageEnv, packageReq, false, params);
    // - > installPackage
    testInstallPackage(installPackage, {id: packageReq});
    // - > updatePackageEnv (with reset, after install)
    testUpdatePackageEnv(updatePackageEnv, packageReq, true, params);
    // - > installPackage - > expect error (already installed)

    // - > logPackage
    testLogPackage(logPackage, {id: packageReq});
    // - > listPackages - > confirm success
    testListPackages(listPackages, packageReq, 'running');
    // - > togglePackage (stop)
    testTogglePackage(togglePackage, {id: packageReq, timeout: 0});
    // - > listPackages - > confirm success
    testListPackages(listPackages, packageReq, 'exited');
    // - > togglePackage (start)
    testTogglePackage(togglePackage, {id: packageReq, timeout: 0});
    // - > listPackages - > confirm success
    testListPackages(listPackages, packageReq, 'running');
    // - > removePackage
    testRemovePackage(removePackage, {id: packageReq, timeout: 0});
    // - > listPackages - > confirm success
    testListPackages(listPackages, packageReq, 'down');
  });


  describe('TEST 2, updatePackageEnv', () => {
    // - > updatePackageEnv (of a non-existent package)
    testUpdatePackageEnv(updatePackageEnv, 'fake.eth', false, params);
  });


  describe('TEST 3, list directory and fetch package info', () => {
    // - > listDirectory
    testListDirectory(listDirectory, packageReq);
    // - > fetchPackageInfo
    testFetchPackageInfo(fetchPackageInfo, {id: packageReq}, packageReq);
  });
}

  // The test will perfom intense tasks and could take up to some minutes
  // TEST - 1
  // - > updatePackageEnv

function testInstallPackage(installPackage, kwargs) {
  it('call installPackage', async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> INSTALLING');
    let res = await installPackage(kwargs);
    let parsedRes = JSON.parse(res);
    expect(parsedRes).to.be.an('object');
    expect(parsedRes.success).to.be.true;
  }).timeout(120*1000);
}


function testLogPackage(logPackage, kwargs) {
  it('call logPackage', async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> LOGGING');
    let res = await logPackage(kwargs);

    let parsedRes = JSON.parse(res);
    expect(parsedRes.success).to.be.true;
    expect(parsedRes.result).to.have.property('id');
    expect(parsedRes.result).to.have.property('logs');
    expect(parsedRes.result.logs).to.be.a('string');
    expect(parsedRes.result.logs).to.include(
      'Attaching to DAppNodePackage-otpweb.dnp.dappnode.eth');
    // let packageNames = parsedRes.result.map(e => name)
    // expect(packageNames).to.include(packageReq)
  });
}


function testListPackages(listPackages, packageName, state) {
  it('call listPackages, to check '+packageName+' is '+state, async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> LISTING');
    let res = await listPackages();
      let parsedRes = JSON.parse(res);
      expect(parsedRes.success).to.be.true;
      // filter returns an array of results (should have only one)
      let pkg = parsedRes.result.find((e) => e.name.includes(packageName));
      if (state == 'down') {
        expect(pkg).to.be.undefined;
      } else {
        expect(pkg).to.be.an('object');
        expect(pkg).to.have.property('state');
        expect(pkg.state).to.equal(state);
      }
  }).timeout(10*1000);
}


function testTogglePackage(togglePackage, kwargs) {
  it('call togglePackage', (done) => {
    logs.info('\x1b[36m%s\x1b[0m', '>> TOGGLING START / STOP');
    togglePackage(kwargs)
    .then((res) => {
      // logs.info('\x1b[33m%s\x1b[0m', res)
      let parsedRes = JSON.parse(res);
      expect(parsedRes.success).to.be.true;
      // let packageNames = parsedRes.result.map(e => name)
      // expect(packageNames).to.include(packageReq)
      done();
    })
    .catch((e) => {
      if (e) logs.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(30*1000);
}


function testRemovePackage(removePackage, kwargs) {
  it('call removePackage', (done) => {
    logs.info('\x1b[36m%s\x1b[0m', '>> REMOVING');
    removePackage(kwargs)
    .then((res) => {
      // logs.info('\x1b[33m%s\x1b[0m', res)
      expect(JSON.parse(res).success).to.be.true;
      done();
    })
    .catch((e) => {
      if (e) logs.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(120*1000);
}


function testUpdatePackageEnv(updatePackageEnv, packageReq, restart, params) {
  const PACKAGE_NAME = packageReq;
  const getPath = require('../utils/getPath');
  const envValue = Date.now();
  const ENV_FILE_PATH = getPath.envFile(PACKAGE_NAME, params);
  const kwargs = {
    id: packageReq,
    envs: {time: envValue},
    restart,
  };

  it('call updatePackageEnv', (done) => {
    logs.info('\x1b[36m%s\x1b[0m', '>> UPDATING ENVS');
    updatePackageEnv(kwargs)
    .then((res) => {
      // logs.info('\x1b[33m%s\x1b[0m', res)
      expect(JSON.parse(res).success).to.be.true;
      let envRes = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      expect(envRes).to.equal('time='+envValue);
      done();
    })
    .catch((e) => {
      if (e) logs.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(120*1000);
}


function testListDirectory(listDirectory, packageName) {
  it('call listDirectory', (done) => {
    logs.info('\x1b[36m%s\x1b[0m', '>> GETTING DIRECTORY');
    listDirectory()
    .then((res) => {
      let parsedRes = JSON.parse(res);
      // logs.info('\x1b[33m%s\x1b[0m', res)
      expect(parsedRes.success).to.be.true;
      // filter returns an array of results (should have only one)
      let pkg = parsedRes.result.filter((e) => {
        return e.name.includes(packageName);
      });
      expect(pkg.length).to.equal(1);
      done();
    })
    .catch((e) => {
      if (e) logs.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(10*1000);
}


function testFetchPackageInfo(fetchPackageInfo, kwargs, packageName) {
  it('call fetchPackageInfo', (done) => {
    logs.info('\x1b[36m%s\x1b[0m', '>> FETCHING PACKAGE INFO');
    fetchPackageInfo(kwargs)
    .then((res) => {
      // logs.info('\x1b[33m%s\x1b[0m', res)
      let parsedRes = JSON.parse(res);
      expect(parsedRes.success).to.be.true;
      expect(parsedRes.result).to.be.a('object');
      expect(parsedRes.result.versions[0].manifest.name).to.equal(packageName);
      done();
    })
    .catch((e) => {
      if (e) logs.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(10*1000);
}
