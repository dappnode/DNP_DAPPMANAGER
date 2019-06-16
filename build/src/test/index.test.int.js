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
async function expectState(id, expectedState) {
  const res = await calls.listPackages();
  const dnps = res.result;
  if (!Array.isArray(dnps)) throw Error("listPackages must return an array");
  const dnp = dnps.find(e => e.name.includes(id));
  const state = dnp ? dnp.state : "down";
  if (state !== expectedState) {
    /* eslint-disable no-console */
    if (!dnp) console.log(dnps);
    /* eslint-enable no-console */
    throw Error(
      `Expected state of ${id} to be "${expectedState}" but it's ${state}`
    );
  }
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

  const idOtpweb = "otpweb.dnp.dappnode.eth";
  const idNginx = "nginx-proxy.dnp.dappnode.eth";

  const shellSafe = cmd => shell(cmd).catch(() => {});

  // add .skip to skip test

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
    await calls.installPackage({ id: idOtpweb });
  }).timeout(5 * 60 * 1000);

  // EXTRA, verify that the envs were set correctly
  it("should had to update DNP ENVs during the installation", () => {
    let envRes = fs.readFileSync(getPath.envFile(idOtpweb, params), "utf8");
    expect(envRes).to.include("VIRTUAL_HOST=\nLETSENCRYPT_HOST=");
  }).timeout(10 * 1000);

  // - > logPackage
  it(`Should call logPackage for ${idOtpweb}`, async () => {
    const res = await calls.logPackage({ id: idOtpweb });
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
      id: idOtpweb,
      envs: { time: envValue },
      restart: true
    });
    expect(res).to.have.property("message");
    let envRes = fs.readFileSync(getPath.envFile(idOtpweb, params), "utf8");
    expect(envRes).to.include(`time=${envValue}`);
  }).timeout(120 * 1000);

  /**
   * 2. Test stopping and removing
   */

  it(`DNP should be running`, async () => {
    await expectState(idOtpweb, "running");
  });

  it("Should stop the DNP", async () => {
    await calls.togglePackage({ id: idOtpweb, timeout: 0 });
  }).timeout(20 * 1000);

  it(`DNP should be running`, async () => {
    await expectState(idOtpweb, "exited");
  });

  it("Should start the DNP", async () => {
    await calls.togglePackage({ id: idOtpweb, timeout: 0 });
  }).timeout(20 * 1000);

  it(`DNP should be running`, async () => {
    await expectState(idOtpweb, "running");
  });

  it("Should restart the DNP", async () => {
    await calls.restartPackage({ id: idOtpweb });
  }).timeout(20 * 1000);

  it(`DNP should be running`, async () => {
    await expectState(idOtpweb, "running");
  });

  /**
   * Test the file transfer
   * - Copy to the container
   * - Copy from the container
   */
  let dataUri;
  const filename = "test.file";
  const toPath = "";

  it("Should copy the file TO the container", async () => {
    dataUri = await getDataUri("./package.json");
    await calls.copyFileTo({ id: idOtpweb, dataUri, filename, toPath });
  }).timeout(20 * 1000);

  // ### TODO, mime-types do not match

  // it("Should copy the file FROM the container", async () => {
  //   dataUri = await getDataUri("./package.json");
  //   const res = await calls.copyFileFrom({ id, fromPath: filename });
  //   expect(res.result).to.equal(dataUri, "Wrong dataUri");
  // }).timeout(20 * 1000);

  /**
   * Restart volumes
   */
  it(`Should restart the package volumes of ${idOtpweb}`, async () => {
    if (idOtpweb !== "otpweb.dnp.dappnode.eth")
      throw Error(`Test expects idOtpweb to equal otpweb.dnp.dappnode.eth`);
    const res = await calls.restartPackageVolumes({ id: idOtpweb });
    expect(res.message).to.equal(
      "otpweb.dnp.dappnode.eth has no named volumes"
    );
  }).timeout(20 * 1000);

  it(`Should restart the package volumes of ${idNginx}`, async () => {
    const res = await calls.restartPackageVolumes({ id: idNginx });
    /**
     * nginx-proxy.dnp.dappnode.eth has one named undeclared volume,
     * so its name will be an unpredictable hash. Full message example:
     * "Restarted nginx-proxy.dnp.dappnode.eth volumes: nginxproxydnpdappnodeeth_html ad09c24035959430f416a259d419d5967ae09d65337ce65e9c9f361a5a3fa1d1 nginxproxydnpdappnodeeth_vhost.d"
     */
    expect(res.message).to.include(
      "Restarted nginx-proxy.dnp.dappnode.eth volumes"
    );
    expect(res.message).to.include("nginxproxydnpdappnodeeth_html");
    expect(res.message).to.include("nginxproxydnpdappnodeeth_vhost.d");
  }).timeout(20 * 1000);

  /**
   * Uninstall the DNP
   * - Test `deleteVolumes: true` for nginx-proxy.dnp.dappnode.eth
   * - Test a normal delete for otpweb
   */
  it(`Should remove DNP ${idNginx}`, async () => {
    await calls.removePackage({ id: idNginx, deleteVolumes: true, timeout: 0 });
  }).timeout(20 * 1000);

  it(`DNP ${idNginx} should be removed`, async () => {
    await expectState(idNginx, "down");
  });

  it(`Should remove DNP ${idOtpweb}`, async () => {
    await calls.removePackage({
      id: idOtpweb,
      deleteVolumes: false,
      timeout: 0
    });
  }).timeout(20 * 1000);

  it(`DNP ${idOtpweb} should be removed`, async () => {
    await expectState(idOtpweb, "down");
  });

  after(async () => {
    this.timeout(60000);
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
