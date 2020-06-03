import "mocha";
import { expect } from "chai";
import path from "path";
import { mapValues } from "lodash";
import shell from "../../src/utils/shell";
import * as calls from "../../src/calls";
import params from "../../src/params";
import { logs } from "../../src/logs";
import { getDnpFromListPackages, getDnpState } from "../testPackageUtils";
import {
  PortMapping,
  UserSettingsAllDnps,
  PackageContainer,
  ManifestWithImage
} from "../../src/types";
import { clearDbs, getTestMountpoint, portProtocols } from "../testUtils";
import { uploadManifestRelease } from "../testReleaseUtils";
import {
  stringifyPortMappings,
  legacyTag
} from "../../src/utils/dockerComposeParsers";
const getDataUri = require("datauri").promise;

// This mountpoints have files inside created by docker with the root
// user group, so they can't be cleaned by other tests.
// #### TODO: While a better solution is found, each test will use a separate dir
const testMountpointDnpLifeCycleMain = getTestMountpoint("dnplifecycle-main");
const testMountpointDnpLifeCycleDep = getTestMountpoint("dnplifecycle-dep");

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

  const idMain = "main.dnp.dappnode.eth";
  const idDep = "dependency.dnp.dappnode.eth";
  const envsMain = {
    ENV_TO_CHANGE: {
      key: "ENV_TO_CHANGE",
      value: "ORIGINAL",
      newValue: "NEW_VALUE"
    },
    ENV_DEFAULT: { key: "ENV_DEFAULT", value: "ORIGINAL" }
  };
  const envsDep = {
    ENV_DEP_TO_CHANGE: {
      key: "ENV_DEP_TO_CHANGE",
      value: "ORIGINAL_DEP",
      newValue: "NEW_VALUE_DEP"
    },
    ENV_DEP_DEFAULT: { key: "ENV_DEP_DEFAULT", value: "ORIGINAL_DEP" }
  };
  const toEnvironment = (envs: {
    [id: string]: { key: string; value: string };
  }): string[] =>
    Object.values(envs).map(({ key, value }) => `${key}=${value}`);

  interface PortMappingWithNew extends PortMapping {
    newHost: number | string;
  }
  interface PortMappingForTest extends PortMappingWithNew {
    portId: string;
  }

  const addPortId = (obj: {
    [id: string]: PortMappingWithNew;
  }): { [id: string]: PortMappingForTest } =>
    mapValues(obj, p => ({ ...p, portId: `${p.container}/${p.protocol}` }));
  const portsMain = addPortId({
    // Unchanged
    one: {
      host: 1111,
      container: 1111,
      protocol: portProtocols.UDP,
      newHost: 1111
    },
    // Change from a host port to a different
    two: {
      host: 2222,
      container: 2222,
      protocol: portProtocols.TCP,
      newHost: 2220
    }
  });
  const volumesMain = {
    changeme: {
      name: "changeme-main",
      newHost: path.resolve(testMountpointDnpLifeCycleMain, "testMountpoint"),
      container: "/temp"
    }
  };
  const portsDep = addPortId({
    // Change from ephemeral to a defined host port
    three: {
      host: undefined,
      container: 3333,
      protocol: portProtocols.UDP,
      newHost: 3330
    },
    // Change from a defined host port to ephemeral
    four: {
      host: 4444,
      container: 4444,
      protocol: portProtocols.TCP,
      newHost: ""
    }
  });
  const volumesDep = {
    changeme: {
      name: "changeme-dep",
      newHost: path.resolve(testMountpointDnpLifeCycleDep, "testBind"),
      container: "/temp"
    }
  };

  const mainDnpManifest: ManifestWithImage = {
    name: idMain,
    version: "0.1.0",
    image: {
      hash: "",
      size: 0,
      path: "",
      environment: toEnvironment(envsMain),
      volumes: [
        "data:/usr",
        `${volumesMain.changeme.name}:${volumesMain.changeme.container}`
      ],
      /* eslint-disable-next-line @typescript-eslint/camelcase */
      external_vol: ["dependencydnpdappnodeeth_data:/usrdep"],
      ports: stringifyPortMappings(Object.values(portsMain))
    }
  };

  const dependencyManifest: ManifestWithImage = {
    name: idDep,
    version: "0.1.0",
    image: {
      hash: "",
      size: 0,
      path: "",
      environment: toEnvironment(envsDep),
      volumes: [
        "data:/usr",
        `${volumesDep.changeme.name}:${volumesDep.changeme.container}`
      ],
      ports: stringifyPortMappings(Object.values(portsDep))
    }
  };

  const toDaraUrl = (s: string): string =>
    `data:application/json;base64,${Buffer.from(s).toString("base64")}`;

  const demoFilePath = "/usr/config.json";
  const fileDataUrlMain = toDaraUrl(idMain); // The content of the test file is the name of the DNP
  const fileDataUrlDep = toDaraUrl(idDep);

  const userSettings: UserSettingsAllDnps = {
    [idMain]: {
      environment: {
        [envsMain.ENV_TO_CHANGE.key]: envsMain.ENV_TO_CHANGE.newValue
      },
      portMappings: {
        [portsMain.two.portId]: String(portsMain.two.newHost)
      },
      namedVolumeMountpoints: {
        [volumesMain.changeme.name]: volumesMain.changeme.newHost
      },
      fileUploads: {
        [demoFilePath]: fileDataUrlMain
      }
    },
    [idDep]: {
      environment: {
        [envsDep.ENV_DEP_TO_CHANGE.key]: envsDep.ENV_DEP_TO_CHANGE.newValue
      },
      portMappings: {
        [portsDep.three.portId]: String(portsDep.three.newHost),
        [portsDep.four.portId]: String(portsDep.four.newHost)
      },
      namedVolumeMountpoints: {
        // ##### DEPRECATED
        [volumesDep.changeme.name]: legacyTag + volumesDep.changeme.newHost
      },
      fileUploads: {
        [demoFilePath]: fileDataUrlDep
      }
    }
  };

  let mainDnpReleaseHash: string;

  async function cleanTestArtifacts(): Promise<void> {
    const cmds = [
      // SUPER important to clean dnp_repo folder to avoid caches
      `rm -rf ${params.REPO_DIR}`,
      // Clean previous stuff
      `docker rm -f ${[
        `DAppNodePackage-${idMain}`,
        `DAppNodePackage-${idDep}`
      ].join(" ")}`,
      // Clean volumes
      `docker volume rm -f $(docker volume ls --filter name=maindnpdappnodeeth_ -q)`,
      `docker volume rm -f $(docker volume ls --filter name=dependencydnpdappnodeeth_ -q)`
    ];
    for (const cmd of cmds) {
      await shellSafe(cmd);
    }
  }

  before(`Clean environment`, async () => {
    await cleanTestArtifacts();

    // Create necessary network
    await shellSafe("docker network create dncore_network");

    // Clean DB
    clearDbs();

    // Print out params
    logs.info("Test params", params);
  });

  before(`Preparing releases for ${idMain} and ${idDep}`, async () => {
    // Prepare a package release with dependencies
    const dependencyUpload = await uploadManifestRelease(dependencyManifest);
    const mainDnpUpload = await uploadManifestRelease({
      ...mainDnpManifest,
      dependencies: {
        [idDep]: dependencyUpload.hash
      }
    });
    mainDnpReleaseHash = mainDnpUpload.hash;
  });

  before("Should resolve a request", async () => {
    const result = await calls.fetchDnpRequest({
      id: mainDnpReleaseHash
    });
    expect(result.name, "Wrong result name").to.equal(idMain);
    expect(result.request.compatible, "Result is not compatible").to.be.ok;
    expect(
      result.request.compatible.dnps,
      "Resolved state should include this dnp"
    ).to.have.property(idMain);
  });

  before("Should install DNP", async () => {
    await calls.installPackage({
      name: idMain,
      version: mainDnpReleaseHash,
      userSettings
    });
  });

  // EXTRA, verify that the envs were set correctly
  describe("Should apply user settings on the installation", () => {
    let dnpMain: PackageContainer;
    let dnpDep: PackageContainer;

    before("Fetch DNPs", async () => {
      const _dnpMain = await getDnpFromListPackages(idMain);
      const _dnpDep = await getDnpFromListPackages(idDep);
      if (!_dnpMain) throw Error(`DNP ${idMain} not found`);
      if (!_dnpDep) throw Error(`DNP ${idDep} not found`);
      dnpMain = _dnpMain;
      dnpDep = _dnpDep;
      // Print status as a sanity check for test debugging
      logs.debug({ dnpMain, dnpDep });
    });

    it(`${idMain} environment`, () => {
      expect(dnpMain.envs).to.deep.equal({
        [envsMain.ENV_TO_CHANGE.key]: envsMain.ENV_TO_CHANGE.newValue,
        [envsMain.ENV_DEFAULT.key]: envsMain.ENV_DEFAULT.value
      });
    });

    it(`${idMain} port mappings`, () => {
      const port1111 = dnpMain.ports.find(
        ({ container }) => container === portsMain.one.container
      );
      const port2222 = dnpMain.ports.find(
        ({ container }) => container === portsMain.two.container
      );
      if (!port1111) throw Error(`Port 1111 not found`);
      if (!port2222) throw Error(`Port 2222 not found`);
      expect(port1111).to.deep.equal({
        host: portsMain.one.host,
        container: portsMain.one.container,
        protocol: portsMain.one.protocol,
        deletable: false
      });
      expect(port2222).to.deep.equal({
        host: portsMain.two.newHost,
        container: portsMain.two.container,
        protocol: portsMain.two.protocol,
        deletable: false
      });
    });

    it(`${idMain} name volume paths`, () => {
      const changemeVolume = dnpMain.volumes.find(
        ({ container }) => container === volumesMain.changeme.container
      );

      if (!changemeVolume) throw Error(`Volume changeme not found`);
      // Using this particular type of bind, the volume path in docker inspect
      // is the default var lib docker
      const dockerDefaultPath = path.join(
        "/var/lib/docker/volumes",
        `${idMain.replace(/\./g, "")}_${volumesMain.changeme.name}`,
        "_data"
      );
      expect(changemeVolume.host).to.equal(dockerDefaultPath);
    });

    it(`${idMain} fileuploads`, async () => {
      const result = await calls.copyFileFrom({
        id: idMain,
        fromPath: demoFilePath
      });
      expect(result).to.equal(fileDataUrlMain);
    });

    it(`${idDep} environment`, () => {
      expect(dnpDep.envs).to.deep.equal({
        [envsDep.ENV_DEP_TO_CHANGE.key]: envsDep.ENV_DEP_TO_CHANGE.newValue,
        [envsDep.ENV_DEP_DEFAULT.key]: envsDep.ENV_DEP_DEFAULT.value
      });
    });

    it(`${idDep} port mappings`, () => {
      // Change from ephemeral to a defined host port
      const port3333 = dnpDep.ports.find(
        ({ container }) => container === portsDep.three.container
      );
      // Change from a defined host port to ephemeral
      const port4444 = dnpDep.ports.find(
        ({ container }) => container === portsDep.four.container
      );

      // Make sure port 4444 is ephemeral
      if (!port4444) throw Error(`Port 4444 not found`);
      expect(port4444.host).to.be.a("number");
      expect(port4444.host).to.be.greaterThan(32768 - 1);
      // Make sure port 3333 is mapped
      if (!port3333) throw Error(`Port 3333 not found`);
      expect(port3333.host).to.equal(portsDep.three.newHost);
    });

    it(`${idDep} name volume paths`, () => {
      const changemeVolume = dnpDep.volumes.find(
        ({ container }) => container === volumesDep.changeme.container
      );
      if (!changemeVolume) throw Error(`Volume changeme not found`);
      expect(changemeVolume.host).to.equal(volumesDep.changeme.newHost);
    });

    it(`${idDep} fileuploads`, async () => {
      const result = await calls.copyFileFrom({
        id: idDep,
        fromPath: demoFilePath
      });
      expect(result).to.equal(fileDataUrlDep);
    });
  });

  // - > logPackage
  describe("Test logPackage", () => {
    before(`DNP should be running`, async () => {
      const state = await getDnpState(idMain);
      expect(state).to.equal("running");
    });

    it(`Should call logPackage for ${idMain}`, async () => {
      const result = await calls.logPackage({ id: idMain });
      expect(result).to.be.a("string");
    });

    it(`Should call logPackage for ${idDep}`, async () => {
      const result = await calls.logPackage({ id: idDep });
      expect(result).to.be.a("string");
    });
  });

  describe("Test updating the package state", () => {
    before(`DNP should be running`, async () => {
      const state = await getDnpState(idMain);
      expect(state).to.equal("running");
    });

    it("Should update DNP envs and reset", async () => {
      const dnpPrev = await getDnpFromListPackages(idMain);
      if (!dnpPrev) throw Error(`DNP ${idMain} not found`);

      // Use randomize value, different on each run
      const envValue = String(Date.now());
      await calls.updatePackageEnv({
        id: idMain,
        envs: { time: envValue }
      });

      const dnpNext = await getDnpFromListPackages(idMain);
      if (!dnpNext) throw Error(`DNP ${idMain} not found`);
      expect(dnpNext.envs).to.deep.equal({
        ...dnpPrev.envs,
        time: envValue
      });
    });

    it(`Should update the port mappings of ${idMain}`, async () => {
      const portNumber = 13131;
      const protocol = "TCP";
      const portMappings: PortMapping[] = [
        { host: portNumber, container: portNumber, protocol }
      ];
      await calls.updatePortMappings({
        id: idMain,
        portMappings
      });

      const dnp = await getDnpFromListPackages(idMain);
      if (!dnp) throw Error(`${idMain} is not found running`);

      const addedPort = dnp.ports.find(p => p.container === portNumber);
      if (!addedPort)
        throw Error(`Added port on ${portNumber} ${protocol} not found`);

      expect(addedPort).to.deep.equal({
        host: portNumber,
        container: portNumber,
        protocol,
        deletable: true
      });
    });
  });

  /**
   * 2. Test stopping and removing
   */

  describe("Test stopping and removing", () => {
    before(`DNP should be running`, async () => {
      const state = await getDnpState(idMain);
      expect(state).to.equal("running");
    });

    it("Should stop the DNP", async () => {
      await calls.togglePackage({ id: idMain, timeout: 0 });
    });

    it(`DNP should be running`, async () => {
      const state = await getDnpState(idMain);
      expect(state).to.equal("exited");
    });

    it("Should start the DNP", async () => {
      await calls.togglePackage({ id: idMain, timeout: 0 });
    });

    it(`DNP should be running`, async () => {
      const state = await getDnpState(idMain);
      expect(state).to.equal("running");
    });

    it("Should restart the DNP", async () => {
      await calls.restartPackage({ id: idMain });
    });

    it(`DNP should be running`, async () => {
      const state = await getDnpState(idMain);
      expect(state).to.equal("running");
    });
  });

  /**
   * Test the file transfer
   * - Copy to the container
   * - Copy from the container
   */
  let dataUri;
  const filename = "test.file";
  const toPath = "";
  describe("Test the file transfer", () => {
    it("Should copy the file TO the container", async () => {
      dataUri = await getDataUri("./package.json");
      await calls.copyFileTo({ id: idMain, dataUri, filename, toPath });
    });

    // ### TODO, mime-types do not match

    // it("Should copy the file FROM the container", async () => {
    //   dataUri = await getDataUri("./package.json");
    //   const res = await calls.copyFileFrom({ id, fromPath: filename });
    //   expect(res.result).to.equal(dataUri, "Wrong dataUri");
    // })
  });

  /**
   * Restart volumes
   */
  describe("Restart volumes", () => {
    // Main depends on the volume of dep, so main should be shutdown
    it(`Should restart the package volumes of ${idDep}`, async () => {
      const dnpMainPrev = await getDnpFromListPackages(idMain);
      await calls.restartPackageVolumes({ id: idDep });
      const dnpMainNext = await getDnpFromListPackages(idMain);

      // To know if main was restarted check that the container is different
      if (!dnpMainPrev) throw Error(`DNP ${idMain} (prev) not found`);
      if (!dnpMainNext) throw Error(`DNP ${idMain} (next) not found`);
      expect(dnpMainPrev.id).to.not.equal(
        dnpMainNext.id,
        `${idMain} container ids are not different, so it was not reseted`
      );
    });

    it(`Should restart the package volumes of ${idMain}`, async () => {
      await calls.restartPackageVolumes({ id: idMain });
      // #### NOTE: The volume "maindnpdappnodeeth_changeme-main" will not be actually
      // removed but it's data will not. Only the reference in /var/lib/docker
      // is deleted
      // #### NOTE: order of the message is not guaranteed, check it by parts
      // Possible message: `Restarted ${idMain} volumes: maindnpdappnodeeth_changeme-main, maindnpdappnodeeth_data`
      // for (const messagePart of [
      //   idMain,
      //   "maindnpdappnodeeth_changeme-main",
      //   "maindnpdappnodeeth_data"
      // ])
      //   expect(res.message).to.include(messagePart, "Wrong result message");
    });
  });

  /**
   * Uninstall the DNP
   * - Test `deleteVolumes: true` for dependency. It should also remove main
   * - Test a normal delete for main
   */

  describe("Uninstall the DNP", () => {
    before(`Should remove DNP ${idDep}`, async () => {
      await calls.removePackage({ id: idDep, deleteVolumes: true });
    });

    // Since main depends on a volume of main, it will removed at the same time
    // as dependency
    it(`DNP ${idDep} and ${idMain} should be removed`, async () => {
      const stateDep = await getDnpState(idDep);
      expect(stateDep).to.equal("down");
      const stateMain = await getDnpState(idMain);
      expect(stateMain).to.equal("down");
    });
  });

  after(async () => {
    await cleanTestArtifacts();
  });
});
