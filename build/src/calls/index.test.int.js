const chai = require('chai');
const expect = require('chai').expect;
const fs = require('fs');
const shell = require('../utils/shell');

chai.should();

describe('All Calls functions: installPackage', function() {
  if (process.env.TEST_INTEGRATION == 'true') {
    integrationTest();
  }
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

  // import dependencies
  const params = require('../params');
  const createDocker = require('../utils/Docker');
  const pkg = require('../utils/packages');
  const createGetManifest = require('../utils/getManifest');
  const dependencies = require('../utils/dependencies');
  const createGetDirectory = require('../modules/createGetDirectory');
  const createAPM = require('../modules/apm');
  const ipfsCalls = require('../modules/ipfsCalls');
  const web3Setup = require('../modules/web3Setup');

  // initialize dependencies (by order)
  const web3 = web3Setup(params); // <-- web3
  const apm = createAPM(web3);
  const getDirectory = createGetDirectory(web3);
  const getManifest = createGetManifest(apm, ipfsCalls);
  const docker = createDocker();
  const getDependencies = dependencies.createGetAllResolvedOrdered(getManifest);
  const download = pkg.createDownload(params, ipfsCalls, docker, log);
  const run = pkg.createRun(params, docker, log);
  const downloadPackages = pkg.createDownloadPackages(download);
  const runPackages = pkg.createRunPackages(run);

  // Initialize calls
  const installPackage = createInstallPackage(getDependencies, downloadPackages, runPackages);
  const removePackage = createRemovePackage(params, docker);
  const togglePackage = createTogglePackage(params, docker);
  const logPackage = createLogPackage(params, docker);
  const listPackages = createListPackages(params); // Needs work
  const listDirectory = createListDirectory(getDirectory);
  const fetchPackageInfo = createFetchPackageInfo(getManifest, apm);
  const updatePackageEnv = createUpdatePackageEnv(params, docker);

  const packageReq = 'otpweb.dnp.dappnode.eth';

  function log(topic, packageName, res) {
    console.log('\x1b[33m%s\x1b[0m', topic, ' ', '\x1b[36m%s\x1b[0m', packageName, ' ', '\x1b[35m%s\x1b[0m', res);
  }

  // add .skip to skip test
  describe('TEST 1, install package, log, toggle twice and delete it', async () => {
    await shell('docker volume create --name=nginxproxydnpdappnodeeth_vhost.d');
    await shell('docker volume create --name=nginxproxydnpdappnodeeth_html');

    beforeRemovePackage(docker, packageReq);
    // The test will perfom intense tasks and could take up to some minutes
    // TEST - 1
    // (before)
    beforeRemovePackage(docker, packageReq);
    // - > updatePackageEnv (without restart, preinstall)
    testUpdatePackageEnv(updatePackageEnv, packageReq, false, params);
    // - > installPackage
    testInstallPackage(installPackage, [packageReq]);
    // - > updatePackageEnv (with reset, after install)
    testUpdatePackageEnv(updatePackageEnv, packageReq, true, params);
    // - > installPackage - > expect error (already installed)

    // - > logPackage
    testLogPackage(logPackage, [packageReq]);
    // - > listPackages - > confirm success
    testListPackages(listPackages, packageReq, 'running');
    // - > togglePackage (stop)
    testTogglePackage(togglePackage, [packageReq, 0]);
    // - > listPackages - > confirm success
    testListPackages(listPackages, packageReq, 'exited');
    // - > togglePackage (start)
    testTogglePackage(togglePackage, [packageReq, 0]);
    // - > listPackages - > confirm success
    testListPackages(listPackages, packageReq, 'running');
    // - > removePackage
    testRemovePackage(removePackage, [packageReq, 0]);
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
    testFetchPackageInfo(fetchPackageInfo, [packageReq], packageReq);
  });
}


function beforeRemovePackage(docker, packageReq) {
  it('Make sure the requested package in not installed', (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> (before) REMOVING');
    docker.compose.down('dnp_repo/'+packageReq+'/docker-compose.yml', {timeout: 0})
    .then((res) => {
      // console.log('\x1b[33m%s\x1b[0m', res)
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });

    // done()
  }).timeout(10*1000);
}


  // The test will perfom intense tasks and could take up to some minutes
  // TEST - 1
  // - > updatePackageEnv

function testInstallPackage(installPackage, args) {
  it('call installPackage', (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> INSTALLING');
    installPackage(args)
    .then((res) => {
      // console.log('\x1b[33m%s\x1b[0m', res)
      expect(JSON.parse(res).success).to.be.true;
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(120*1000);
}


function testLogPackage(logPackage, args) {
  it('call logPackage', (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> LOGGING');
    logPackage(args)
    .then((res) => {
      // console.log('\x1b[33m%s\x1b[0m', res)
      let parsedRes = JSON.parse(res);
      expect(parsedRes.success).to.be.true;
      expect(parsedRes.result).to.be.a('string');
      expect(parsedRes.result).to.include('Attaching to DAppNodePackage-otpweb.dnp.dappnode.eth');
      // let packageNames = parsedRes.result.map(e => name)
      // expect(packageNames).to.include(packageReq)
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(10*1000);
}


function testListPackages(listPackages, packageName, state) {
  it('call listPackages, to check '+packageName+' is '+state, (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> LISTING');
    listPackages()
    .then((res) => {
      let parsedRes = JSON.parse(res);
      expect(parsedRes.success).to.be.true;
      // filter returns an array of results (should have only one)
      let pkg = parsedRes.result.filter((e) => {
        return e.name.includes(packageName);
      })[0];
      // console.log('\x1b[33m%s\x1b[0m', pkg)
      if (state == 'down') {
        expect(pkg).to.be.undefined;
      } else {
        expect(pkg.state).to.equal(state);
      }
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(10*1000);
}


function testTogglePackage(togglePackage, args) {
  it('call togglePackage', (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> TOGGLING START / STOP');
    togglePackage(args)
    .then((res) => {
      // console.log('\x1b[33m%s\x1b[0m', res)
      let parsedRes = JSON.parse(res);
      expect(parsedRes.success).to.be.true;
      // let packageNames = parsedRes.result.map(e => name)
      // expect(packageNames).to.include(packageReq)
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(30*1000);
}


function testRemovePackage(removePackage, args) {
  it('call removePackage', (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> REMOVING');
    removePackage(args)
    .then((res) => {
      // console.log('\x1b[33m%s\x1b[0m', res)
      expect(JSON.parse(res).success).to.be.true;
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(120*1000);
}


function testUpdatePackageEnv(updatePackageEnv, packageReq, restart, params) {
  const PACKAGE_NAME = packageReq;
  const getPath = require('../utils/getPath');
  const envValue = Date.now();
  const ENV_FILE_PATH = getPath.ENV_FILE(PACKAGE_NAME, params);

  it('call updatePackageEnv', (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> UPDATING ENVS');
    updatePackageEnv([packageReq, JSON.stringify({time: envValue}), restart])
    .then((res) => {
      // console.log('\x1b[33m%s\x1b[0m', res)
      expect(JSON.parse(res).success).to.be.true;
      let envRes = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      expect(envRes).to.equal('time='+envValue);
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(120*1000);
}


function testListDirectory(listDirectory, packageName) {
  it('call listDirectory', (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> GETTING DIRECTORY');
    listDirectory()
    .then((res) => {
      let parsedRes = JSON.parse(res);
      // console.log('\x1b[33m%s\x1b[0m', res)
      expect(parsedRes.success).to.be.true;
      // filter returns an array of results (should have only one)
      let pkg = parsedRes.result.filter((e) => {
        return e.name.includes(packageName);
      });
      expect(pkg.length).to.equal(1);
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(10*1000);
}


function testFetchPackageInfo(fetchPackageInfo, args, packageName) {
  it('call fetchPackageInfo', (done) => {
    console.log('\x1b[36m%s\x1b[0m', '>> FETCHING PACKAGE INFO');
    fetchPackageInfo(args)
    .then((res) => {
      // console.log('\x1b[33m%s\x1b[0m', res)
      let parsedRes = JSON.parse(res);
      expect(parsedRes.success).to.be.true;
      expect(parsedRes.result).to.be.a('object');
      expect(parsedRes.result.versions[0].manifest.name).to.equal(packageName);
      done();
    })
    .catch((e) => {
      if (e) console.error(e);
      expect(e).to.be.undefined;
    });
  }).timeout(10*1000);
}
