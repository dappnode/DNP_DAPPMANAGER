const chai = require("chai");
const expect = require("chai").expect;
const fs = require("fs");
const shell = require("utils/shell");
const logs = require("logs.js")(module);
const calls = require("calls");
const getPath = require("utils/getPath");
const getDataUri = require("datauri").promise;

chai.should();

// Utils
async function getDnpFromListPackages(id) {
  const res = await calls.listPackages();
  if (!Array.isArray(res.result))
    throw Error("listPackages must return an array");
  return res.result.find(e => e.name.includes(id));
}

async function getDnpState(id) {
  const dnp = await getDnpFromListPackages(id);
  return dnp ? dnp.state : "down";
}

describe("Full integration test with REAL docker: ", function() {
  // import calls

  // const restartPackageVolumes = require('calls/restartPackageVolumes');

  // const fetchDirectory = require('calls/fetchDirectory');
  // const fetchPackageVersions = require('calls/fetchPackageVersions');
  // const fetchPackageData = require('calls/fetchPackageData');

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

    /**
     * 1. Install DNP
     */

    it("Should install DNP", async () => {
      await calls.installPackage({ id });
    }).timeout(5 * 60 * 1000);

    // EXTRA, verify that the envs were set correctly
    it("should had to update DNP ENVs during the installation", () => {
      let envRes = fs.readFileSync(getPath.envFile(id, params), "utf8");
      expect(envRes).to.include("VIRTUAL_HOST=\nLETSENCRYPT_HOST=");
    }).timeout(10 * 1000);

    // - > logPackage
    it(`Should call logPackage for ${id}`, async () => {
      const res = await calls.logPackage({ id });
      expect(res).to.have.property("message");
      expect(res.result).to.be.a("string");
    }).timeout(10 * 1000);

    it(`Should call logPackage for letsencrypt-nginx.dnp.dappnode.eth`, async () => {
      const res = await calls.logPackage({
        id: "letsencrypt-nginx.dnp.dappnode.eth"
      });
      expect(res).to.have.property("message");
      expect(res.result).to.be.a("string");
    }).timeout(10 * 1000);

    it(`Should call logPackage for nginx-proxy.dnp.dappnode.eth`, async () => {
      const res = await calls.logPackage({
        id: "nginx-proxy.dnp.dappnode.eth"
      });
      expect(res).to.have.property("message");
      expect(res.result).to.be.a("string");
    }).timeout(10 * 1000);

    it("Should update DNP envs and reset", async () => {
      // Use randomize value, different on each run
      const envValue = Date.now();
      const res = await calls.updatePackageEnv({
        id,
        envs: { time: envValue },
        restart: true
      });
      expect(res).to.have.property("message");
      let envRes = fs.readFileSync(getPath.envFile(id, params), "utf8");
      expect(envRes).to.include(`time=${envValue}`);
    }).timeout(120 * 1000);

    /**
     * 2. Test stopping and removing
     */

    it(`DNP should be running`, async () => {
      const state = await getDnpState(id);
      expect(state).to.equal("running");
    });

    it("Should stop the DNP", async () => {
      await calls.togglePackage({ id, timeout: 0 });
    }).timeout(20 * 1000);

    it(`DNP should be running`, async () => {
      const state = await getDnpState(id);
      expect(state).to.equal("exited");
    });

    it("Should start the DNP", async () => {
      await calls.togglePackage({ id, timeout: 0 });
    }).timeout(20 * 1000);

    it(`DNP should be running`, async () => {
      const state = await getDnpState(id);
      expect(state).to.equal("running");
    });

    it("Should restart the DNP", async () => {
      await calls.restartPackage({ id });
    }).timeout(20 * 1000);

    it(`DNP should be running`, async () => {
      const state = await getDnpState(id);
      expect(state).to.equal("running");
    });

    /**
     * Test the file transfer
     * - Copy to the container
     * - Copy from the container
     */
    let dataUri;
    const filename = "test.file";
    const toPath = "";

    it("Should copy the file to the container", async () => {
      dataUri = await getDataUri("./package.json");
      await calls.copyFileTo({ id, dataUri, filename, toPath });
    }).timeout(20 * 1000);

    it("Should copy the file to the container", async () => {
      dataUri = await getDataUri("./package.json");
      const res = await calls.copyFileFrom({ id, fromPath: filename });
      expect(res.result).to.equal(dataUri, "Wrong dataUri");
    }).timeout(20 * 1000);

    /**
     * Uninstall the DNP
     */

    it("Should remove DNP", async () => {
      await calls.removePackage({ id, deleteVolumes: false, timeout: 0 });
    }).timeout(20 * 1000);

    it(`DNP should be removed`, async () => {
      const state = await getDnpState(id);
      expect(state).to.equal("down");
    });
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
