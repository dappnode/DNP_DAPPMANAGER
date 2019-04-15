const chai = require("chai");
const expect = require("chai").expect;
const fs = require("fs");
const shell = require("utils/shell");
const logs = require("logs.js")(module);

chai.should();

describe("Full integration test with REAL docker: ", function() {
  // import calls
  const installPackage = require("calls/installPackage");
  const removePackage = require("calls/removePackage");
  const togglePackage = require("calls/togglePackage");
  // const restartPackage = require('calls/restartPackage');
  // const restartPackageVolumes = require('calls/restartPackageVolumes');
  const logPackage = require("calls/logPackage");
  const updatePackageEnv = require("calls/updatePackageEnv");
  const listPackages = require("calls/listPackages");
  // const fetchDirectory = require('calls/fetchDirectory');
  // const fetchPackageVersions = require('calls/fetchPackageVersions');
  // const fetchPackageData = require('calls/fetchPackageData');
  // const managePorts = require('calls/managePorts');
  // const getUserActionLogs = require('calls/getUserActionLogs');

  // import dependencies
  const params = require("params");

  const packageReq = "otpweb.dnp.dappnode.eth";
  const id = packageReq;

  const shellSafe = cmd => shell(cmd).catch(() => {});

  // add .skip to skip test
  describe("TEST 1, install package, log, toggle twice and delete it", () => {
    before(async () => {
      this.timeout(60000);
      // runs before all tests in this block
      const cmds = [
        "docker volume create --name=nginxproxydnpdappnodeeth_vhost.d",
        "docker volume create --name=nginxproxydnpdappnodeeth_html",
        "docker network create dncore_network",
        // Clean previous stuff
        "rm -rf dnp_repo/nginx-proxy.dnp.dappnode.eth/",
        "rm -rf dnp_repo/letsencrypt-nginx.dnp.dappnode.eth/",
        `docker rm -f ${[
          "DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth",
          "DAppNodePackage-nginx-proxy.dnp.dappnode.eth"
        ].join(" ")}`
      ];
      for (const cmd of cmds) {
        await shellSafe(cmd);
      }
    });

    // The test will perfom intense tasks and could take up to some minutes
    // TEST - 1
    // (before)

    // - > installPackage
    testInstallPackage(installPackage, { id });

    // EXTRA, verify that the envs were set correctly
    it("should had to update DNP ENVs during the installation", async () => {
      const getPath = require("utils/getPath");
      const ENV_FILE_PATH = getPath.envFile(id, params);
      let envRes = fs.readFileSync(ENV_FILE_PATH, "utf8");
      expect(envRes).to.include("VIRTUAL_HOST=\nLETSENCRYPT_HOST=");
    }).timeout(10 * 1000);

    // - > logPackage
    testLogPackage(logPackage, {
      id,
      options: {}
    });
    testLogPackage(logPackage, {
      id: "letsencrypt-nginx.dnp.dappnode.eth",
      options: {}
    });
    testLogPackage(logPackage, {
      id: "nginx-proxy.dnp.dappnode.eth",
      options: {}
    });

    // - > updatePackageEnv (with reset, after install)
    testUpdatePackageEnv(updatePackageEnv, id, true, params);

    // - > installPackage - > expect error (already installed)

    // - > listPackages - > confirm success
    testListPackages(listPackages, id, "running");

    // - > togglePackage (stop)
    testTogglePackage(togglePackage, { id, timeout: 0 });

    // - > listPackages - > confirm success
    testListPackages(listPackages, id, "exited");

    // - > togglePackage (start)
    testTogglePackage(togglePackage, { id, timeout: 0 });

    // - > listPackages - > confirm success
    testListPackages(listPackages, id, "running");

    // - > removePackage
    testRemovePackage(removePackage, { id, deleteVolumes: false, timeout: 0 });

    // - > listPackages - > confirm success
    testListPackages(listPackages, id, "down");
  });

  after(async () => {
    this.timeout(60000);
    logs.info("\x1b[36m%s\x1b[0m >> CLOSING TEST");
    const web3 = require("modules/web3Setup");
    web3.clearWatch();
    if (
      web3.currentProvider &&
      web3.currentProvider.connection &&
      web3.currentProvider.connection.close
    ) {
      logs.info(
        `\x1b[36m%s\x1b[0m >> CLOSING WS: ${web3.currentProvider.host}`
      );
      web3.currentProvider.connection.close();
    }
    const cmds = [
      // Clean stuff
      "rm -rf dnp_repo/nginx-proxy.dnp.dappnode.eth/",
      "rm -rf dnp_repo/letsencrypt-nginx.dnp.dappnode.eth/",
      `docker rm -f ${[
        "DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth",
        "DAppNodePackage-nginx-proxy.dnp.dappnode.eth"
      ].join(" ")}`
    ];
    for (const cmd of cmds) {
      await shellSafe(cmd);
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
  it("call installPackage", done => {
    logs.info("\x1b[36m%s\x1b[0m >> INSTALLING");
    installPackage(kwargs)
      .then(
        res => {
          expect(res).to.have.property("message");
        },
        e => {
          if (e) logs.error(e.stack);
          expect(e).to.be.undefined;
        }
      )
      .then(done);
  }).timeout(5 * 60 * 1000);
}

function testLogPackage(logPackage, kwargs) {
  it("call logPackage", async () => {
    logs.info("\x1b[36m%s\x1b[0m >> LOGGING");
    const res = await logPackage(kwargs);
    expect(res).to.have.property("message");
    expect(res.result).to.be.a("string");
    // let packageNames = parsedRes.result.map(e => name)
    // expect(packageNames).to.include(packageReq)
  }).timeout(10 * 1000);
}

function testListPackages(listPackages, packageName, state) {
  it(`calling listPackages, to check ${packageName} is ${state}`, async () => {
    logs.info("\x1b[36m%s\x1b[0m >> LISTING");
    const res = await listPackages();
    expect(res).to.have.property("message");
    // filter returns an array of results (should have only one)
    let pkg = res.result.filter(e => {
      return e.name.includes(packageName);
    })[0];
    if (state == "down") expect(pkg).to.be.undefined;
    else expect(pkg.state).to.equal(state);
  }).timeout(10 * 1000);
}

function testTogglePackage(togglePackage, kwargs) {
  it("call togglePackage", async () => {
    logs.info("\x1b[36m%s\x1b[0m >> TOGGLING START / STOP");
    const res = await togglePackage(kwargs);
    expect(res).to.have.property("message");
  }).timeout(20 * 1000);
}

function testRemovePackage(removePackage, kwargs) {
  it("call removePackage", async () => {
    logs.info("\x1b[36m%s\x1b[0m >> REMOVING");
    const res = await removePackage(kwargs);
    expect(res).to.have.property("message");
  }).timeout(20 * 1000);
}

function testUpdatePackageEnv(updatePackageEnv, id, restart, params) {
  const getPath = require("utils/getPath");
  const envValue = Date.now();
  const ENV_FILE_PATH = getPath.envFile(id, params);

  it("call updatePackageEnv", async () => {
    logs.info("\x1b[36m%s\x1b[0m >> UPDATING ENVS");
    const res = await updatePackageEnv({
      id,
      envs: { time: envValue },
      restart
    });
    expect(res).to.have.property("message");
    let envRes = fs.readFileSync(ENV_FILE_PATH, "utf8");
    expect(envRes).to.include(`time=${envValue}`);
  }).timeout(120 * 1000);
}
