import "mocha";
import { expect } from "chai";
import * as db from "../src/db";
import shell from "../src/utils/shell";
import * as calls from "../src/calls";
import params from "../src/params";
const getDataUri = require("datauri").promise;
import Logs from "../src/logs";
import { PackageContainer, ContainerStatus, PortMapping } from "../src/types";
import { getDnpFromListPackages, getDnpState } from "./testPackageUtils";
const logs = Logs(module);

// Utils

const shellSafe = (cmd: string): Promise<string | void> =>
  shell(cmd).catch(() => {});

/**
 * PASSWORD MANAGMENT
 * [NOT-TESTED] Too obtrusive and destructive system calls, test on QA
 * - passwordChange
 * - passwordIsSecure
 */

/**
 * POWER MANAGMENT
 * [NOT-TESTED] Too obtrusive and destructive system calls, test on QA
 * - poweroffHost
 * - rebootHost
 */

//           #### Must be function() for this.timeout ####
describe("DNP lifecycle", function() {
  //         #### Must be function() for this.timeout ####
  const idOtpweb = "otpweb.dnp.dappnode.eth";
  const idNginx = "nginx-proxy.dnp.dappnode.eth";
  const idLetsencrypt = "letsencrypt-nginx.dnp.dappnode.eth";

  before(async () => {
    this.timeout(60 * 1000);
    // runs before all tests in this block
    const cmds = [
      "docker volume create --name=nginxproxydnpdappnodeeth_vhost.d",
      "docker volume create --name=nginxproxydnpdappnodeeth_html",
      "docker network create dncore_network",
      // Clean previous stuff
      "rm -rf dnp_repo/nginx-proxy.dnp.dappnode.eth/",
      "rm -rf dnp_repo/letsencrypt-nginx.dnp.dappnode.eth/",
      `docker rm -f ${[
        "DAppNodePackage-otpweb.dnp.dappnode.eth",
        "DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth",
        "DAppNodePackage-nginx-proxy.dnp.dappnode.eth"
      ].join(" ")}`
    ];
    for (const cmd of cmds) {
      await shellSafe(cmd);
    }

    // Clean DB
    db.clearDb();

    // Print out params
    logs.info("Test params");
    logs.info(JSON.stringify(params, null, 2));
  });

  it("Should resolve a request", async () => {
    const { result } = await calls.resolveRequest({
      req: { name: idOtpweb, ver: "*" }
    });
    expect(result.state).to.have.property(idOtpweb);
  }).timeout(5 * 60 * 1000);

  it("Should install DNP", async () => {
    await calls.installPackage({ id: idOtpweb });
  }).timeout(5 * 60 * 1000);

  // EXTRA, verify that the envs were set correctly
  it("should had to update DNP ENVs during the installation", async () => {
    const dnp = await getDnpFromListPackages(idOtpweb);
    if (!dnp) throw Error(`DNP ${idOtpweb} not found`);
    expect(dnp.envs).to.deep.equal({
      VIRTUAL_HOST: "",
      LETSENCRYPT_HOST: ""
    });
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
    const envValue = String(Date.now());
    const res = await calls.updatePackageEnv({
      id: idOtpweb,
      envs: { time: envValue }
    });
    expect(res).to.have.property("message");

    const dnp = await getDnpFromListPackages(idOtpweb);
    if (!dnp) throw Error(`DNP ${idOtpweb} not found`);
    expect(dnp.envs).to.deep.equal({
      VIRTUAL_HOST: "",
      LETSENCRYPT_HOST: "",
      time: envValue
    });
  }).timeout(120 * 1000);

  /**
   * 2. Test stopping and removing
   */

  it(`DNP should be running`, async () => {
    const state = await getDnpState(idOtpweb);
    expect(state).to.equal("running");
  });

  it("Should stop the DNP", async () => {
    await calls.togglePackage({ id: idOtpweb, timeout: 0 });
  }).timeout(20 * 1000);

  it(`DNP should be running`, async () => {
    const state = await getDnpState(idOtpweb);
    expect(state).to.equal("exited");
  });

  it("Should start the DNP", async () => {
    await calls.togglePackage({ id: idOtpweb, timeout: 0 });
  }).timeout(20 * 1000);

  it(`DNP should be running`, async () => {
    const state = await getDnpState(idOtpweb);
    expect(state).to.equal("running");
  });

  it("Should restart the DNP", async () => {
    await calls.restartPackage({ id: idOtpweb });
  }).timeout(20 * 1000);

  it(`DNP should be running`, async () => {
    const state = await getDnpState(idOtpweb);
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
    const res = await calls.restartPackageVolumes({
      id: idNginx,
      doNotRestart: true
    });
    /**
     * [NOTE]: The letsencrypt-nginx.dnp.dappnode.eth manifest is wrong.
     * The volumes of nginx-proxy are not correctly defined, so this test fails
     * To solve this:
     * - Run the restart with `doNotRestart: true`
     * - Create the volumes manually
     * - Up the packages
     *
     * [NOTE] nginx-proxy.dnp.dappnode.eth has one named undeclared volume,
     * so its name will be an unpredictable hash. Full message example:
     * "Restarted nginx-proxy.dnp.dappnode.eth volumes: nginxproxydnpdappnodeeth_html ad09c24035959430f416a259d419d5967ae09d65337ce65e9c9f361a5a3fa1d1 nginxproxydnpdappnodeeth_vhost.d"
     */
    expect(res.message).to.include(
      "Restarted nginx-proxy.dnp.dappnode.eth volumes"
    );
    expect(res.message).to.include("nginxproxydnpdappnodeeth_html");
    expect(res.message).to.include("nginxproxydnpdappnodeeth_vhost.d");

    for (const vol of [
      "nginxproxydnpdappnodeeth_html",
      "nginxproxydnpdappnodeeth_vhost.d"
    ])
      await shell(`docker volume create --name=${vol}`);

    for (const dnpName of [idNginx, idLetsencrypt])
      await calls.restartPackage({ id: dnpName });
  }).timeout(20 * 1000);

  it(`Should update the port mappings of ${idOtpweb}`, async () => {
    const portNumber = 13131;
    const protocol = "TCP";
    const portMappings: PortMapping[] = [
      { host: portNumber, container: portNumber, protocol }
    ];
    await calls.updatePortMappings({
      id: idOtpweb,
      portMappings
    });

    const dnp = await getDnpFromListPackages(idOtpweb);
    if (!dnp) throw Error(`${idOtpweb} is not found running`);

    const addedPort = dnp.ports.find(p => p.container === portNumber);
    if (!addedPort)
      throw Error(`Added port on ${portNumber} ${protocol} not found`);

    expect(addedPort).to.deep.equal({
      host: portNumber,
      container: portNumber,
      protocol,
      deletable: true
    });
  }).timeout(30 * 1000);

  /**
   * Uninstall the DNP
   * - Test `deleteVolumes: true` for nginx-proxy.dnp.dappnode.eth
   * - Test a normal delete for otpweb
   */
  it(`Should remove DNP ${idNginx}`, async () => {
    await calls.removePackage({ id: idNginx, deleteVolumes: true });
  }).timeout(20 * 1000);

  it(`DNP ${idNginx} should be removed`, async () => {
    const state = await getDnpState(idNginx);
    expect(state).to.equal("down");
  });

  it(`Should remove DNP ${idOtpweb}`, async () => {
    await calls.removePackage({
      id: idOtpweb,
      deleteVolumes: false
    });
  }).timeout(20 * 1000);

  it(`DNP ${idOtpweb} should be removed`, async () => {
    const state = await getDnpState(idOtpweb);
    expect(state).to.equal("down");
  });

  after(async () => {
    this.timeout(60000);
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
