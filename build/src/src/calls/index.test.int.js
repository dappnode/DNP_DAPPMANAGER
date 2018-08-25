const chai = require('chai');
const expect = require('chai').expect;
const fs = require('fs');
const shell = require('utils/shell');
const logs = require('logs.js')(module);

chai.should();

describe('Full integration test with REAL docker: ', function() {
  // import calls
  const createInstallPackage = require('calls/createInstallPackage');
  const createRemovePackage = require('calls/createRemovePackage');
  const createTogglePackage = require('calls/createTogglePackage');
  // const createRestartPackage = require('calls/createRestartPackage');
  // const createRestartPackageVolumes = require('calls/createRestartPackageVolumes');
  const createLogPackage = require('calls/createLogPackage');
  const createUpdatePackageEnv = require('calls/createUpdatePackageEnv');
  const createListPackages = require('calls/createListPackages');
  const createFetchDirectory = require('calls/createFetchDirectory');
  const createFetchPackageVersions = require('calls/createFetchPackageVersions');
  // const createFetchPackageData = require('calls/createFetchPackageData');
  // const createManagePorts = require('calls/createManagePorts');
  // const createGetUserActionLogs = require('calls/createGetUserActionLogs');

  // import dependencies
  const params = require('params');
  const pkg = require('utils/packages');
  const createGetManifest = require('utils/getManifest');
  const dependencies = require('utils/dependencies');
  const createGetDirectory = require('modules/createGetDirectory');
  const apmFactory = require('modules/apm');

  // initialize dependencies (by order)
  const apm = apmFactory({});
  const getDirectory = createGetDirectory({});
  const getManifest = createGetManifest({apm});
  const getAllDependencies = dependencies.createGetAllResolvedOrdered(getManifest);
  const download = pkg.downloadFactory({});
  const run = pkg.runFactory({});

  // Initialize calls
  const installPackage = createInstallPackage({getAllDependencies, download, run});
  const removePackage = createRemovePackage({});
  const togglePackage = createTogglePackage({});
  // const restartPackage = createRestartPackage({});
  // const restartPackageVolumes = createRestartPackageVolumes({});
  const logPackage = createLogPackage({});
  const listPackages = createListPackages({}); // Needs work
  const fetchDirectory = createFetchDirectory({getDirectory});
  const fetchPackageVersions = createFetchPackageVersions({getManifest, apm});
  const updatePackageEnv = createUpdatePackageEnv({});
  // const fetchPackageData = createFetchPackageData({getManifest});
  // const managePorts = createManagePorts({});
  // const getUserActionLogs = createGetUserActionLogs({});

  const packageReq = 'otpweb.dnp.dappnode.eth';
  const id = packageReq;

  // add .skip to skip test
  describe.skip('TEST 1, install package, log, toggle twice and delete it', async () => {
    await shell('docker volume create --name=nginxproxydnpdappnodeeth_vhost.d')
    .catch(() => {});
    await shell('docker volume create --name=nginxproxydnpdappnodeeth_html')
    .catch(() => {});
    await shell('docker network create dncore_network')
    .catch(() => {});
    // Clean previous stuff
    await shell('rm -rf dnp_repo/nginx-proxy.dnp.dappnode.eth/')
    .catch(() => {});
    await shell('rm -rf dnp_repo/letsencrypt-nginx.dnp.dappnode.eth/')
    .catch(() => {});
    await shell('docker rm -f '
      +'DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth '
      +'DAppNodePackage-nginx-proxy.dnp.dappnode.eth')
    .catch(() => {});


    // The test will perfom intense tasks and could take up to some minutes
    // TEST - 1
    // (before)

    // - > updatePackageEnv (without restart, preinstall)
    testUpdatePackageEnv(updatePackageEnv, id, false, params);

    // - > installPackage
    testInstallPackage(installPackage, {id});

    // - > logPackage
    testLogPackage(logPackage, {
      id,
      options: {},
    });
    testLogPackage(logPackage, {
      id: 'letsencrypt-nginx.dnp.dappnode.eth',
      options: {},
    });
    testLogPackage(logPackage, {
      id: 'nginx-proxy.dnp.dappnode.eth',
      options: {},
    });


    // - > updatePackageEnv (with reset, after install)
    testUpdatePackageEnv(updatePackageEnv, id, true, params);

    // - > installPackage - > expect error (already installed)

    // - > listPackages - > confirm success
    testListPackages(listPackages, id, 'running');

    // - > togglePackage (stop)
    testTogglePackage(togglePackage, {id, timeout: 0});

    // - > listPackages - > confirm success
    testListPackages(listPackages, id, 'exited');

    // - > togglePackage (start)
    testTogglePackage(togglePackage, {id, timeout: 0});

    // - > listPackages - > confirm success
    testListPackages(listPackages, id, 'running');

    // - > removePackage
    testRemovePackage(removePackage, {id, deleteVolumes: false, timeout: 0});

    // - > listPackages - > confirm success
    testListPackages(listPackages, id, 'down');
  });


  describe('TEST 2, updatePackageEnv', () => {
    // - > updatePackageEnv (of a non-existent package)
    testUpdatePackageEnv(updatePackageEnv, 'fake.eth', false, params);
  });


  describe('TEST 3, list directory and fetch package info', () => {
    // - > fetchDirectory
    const id = 'otpweb.dnp.dappnode.eth';
    testFetchDirectory(fetchDirectory, id);
    // - > fetchPackageVersions
    testFetchPackageVersions(fetchPackageVersions, id);
  });

  describe('Close test', () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> LOGGING');
    const web3Setup = require('modules/web3Setup');
    const web3 = web3Setup({});
    web3.clearWatch();
    if (web3.currentProvider.host.startsWith('ws')) {
      logs.info('\x1b[36m%s\x1b[0m', '>> CLOSING WS: '+web3.currentProvider.host);
      web3.currentProvider.connection.close();
    } else if (web3.currentProvider.host.startsWith('http')) {
      logs.info('\x1b[36m%s\x1b[0m', '>> IGNORING HTTP PROVIDER: '+web3.currentProvider.host);
    } else {
      logs.info('\x1b[36m%s\x1b[0m', '>> UNKNOWN PROVIDER: '+web3.currentProvider.host);
    }
  });
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
// - > fetchDirectory
// - > fetchPackageVersions


// The test will perfom intense tasks and could take up to some minutes
// TEST - 1
// - > updatePackageEnv

function testInstallPackage(installPackage, kwargs) {
  it('call installPackage', (done) => {
    logs.info('\x1b[36m%s\x1b[0m', '>> INSTALLING');
    installPackage(kwargs)
    .then(
      (res) => {
        // logs.info('\x1b[33m%s\x1b[0m', res)
        expect(res).to.have.property('message');
      },
      (e) => {
        if (e) logs.error(e.stack);
        expect(e).to.be.undefined;
      }
    ).then(done);
  }).timeout(120*1000);
}


function testLogPackage(logPackage, kwargs) {
  it('call logPackage', async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> LOGGING');
    const res = await logPackage(kwargs);
    // logs.info('\x1b[33m%s\x1b[0m', res)
    expect(res).to.have.property('message');
    expect(res.result).to.be.a('object');
    expect(res.result).to.have.property('logs');
    expect(res.result.logs).to.be.a('string');
    // let packageNames = parsedRes.result.map(e => name)
    // expect(packageNames).to.include(packageReq)
  }).timeout(10*1000);
}


function testListPackages(listPackages, packageName, state) {
  it('call listPackages, to check '+packageName+' is '+state, async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> LISTING');
    const res = await listPackages();
    expect(res).to.have.property('message');
    // filter returns an array of results (should have only one)
    let pkg = res.result.filter((e) => {
      return e.name.includes(packageName);
    })[0];
    // logs.info('\x1b[33m%s\x1b[0m', pkg)
    if (state == 'down') expect(pkg).to.be.undefined;
    else expect(pkg.state).to.equal(state);
  }).timeout(10*1000);
}


function testTogglePackage(togglePackage, kwargs) {
  it('call togglePackage', async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> TOGGLING START / STOP');
    const res = await togglePackage(kwargs);
    expect(res).to.have.property('message');
  }).timeout(20*1000);
}


function testRemovePackage(removePackage, kwargs) {
  it('call removePackage', async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> REMOVING');
    const res = await removePackage(kwargs);
    expect(res).to.have.property('message');
  }).timeout(20*1000);
}


function testUpdatePackageEnv(updatePackageEnv, id, restart, params) {
  const getPath = require('utils/getPath');
  const envValue = Date.now();
  const ENV_FILE_PATH = getPath.envFile(id, params);

  it('call updatePackageEnv', async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> UPDATING ENVS');
    const res = await updatePackageEnv({
      id,
      envs: {time: envValue},
      restart,
    });
    expect(res).to.have.property('message');
    let envRes = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    expect(envRes).to.equal('time='+envValue);
  }).timeout(120*1000);
}


function testFetchDirectory(fetchDirectory, packageName) {
  it('call fetchDirectory', async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> GETTING DIRECTORY');
    const res = await fetchDirectory();
    expect(res).to.have.property('message');
    // filter returns an array of results (should have only one)
    let pkg = res.result.find((e) => e.name.includes(packageName));
    expect(pkg).to.exist;
    expect(pkg).to.have.property('status');
  }).timeout(10*1000);
}


function testFetchPackageVersions(fetchPackageVersions, id) {
  it('call fetchPackageVersions', async () => {
    logs.info('\x1b[36m%s\x1b[0m', '>> FETCHING PACKAGE INFO');
    const res = await fetchPackageVersions({id});
    expect(res).to.have.property('message');
    expect(res.result).to.be.a('array');
    const firstVersion = res.result[res.result.length - 1];
    expect(firstVersion).to.be.a('object');
    expect(firstVersion.manifest.name).to.equal(id);
    expect(firstVersion.version).to.equal('0.0.1');
  }).timeout(10*1000);
}
