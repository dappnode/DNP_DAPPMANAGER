import "mocha";
import { expect } from "chai";
import path from "path";
import { mapValues, pick } from "lodash";
import * as calls from "../../src/calls";
import params from "../../src/params";
import { logs } from "../../src/logs";
import { getDnpFromListPackages, getDnpState } from "../testPackageUtils";
import {
  PortMapping,
  UserSettingsAllDnps,
  PackageContainer,
  ManifestWithImage,
  PackageEnvs,
  InstalledPackageData
} from "../../src/types";
import {
  clearDbs,
  getTestMountpoint,
  portProtocols,
  shellSafe,
  cleanRepos,
  cleanContainers,
  sampleFile
} from "../testUtils";
import { uploadManifestRelease } from "../testReleaseUtils";
import fileToDataUri from "../../src/utils/fileToDataUri";
import {
  stringifyPortMappings,
  parseEnvironment
} from "../../src/modules/compose";
import { containerInspect } from "../../src/modules/docker/dockerApi";
import { listContainer } from "../../src/modules/docker/listContainers";

// This mountpoints have files inside created by docker with the root
// user group, so they can't be cleaned by other tests.
// #### TODO: While a better solution is found, each test will use a separate dir
const testMountpointDnpLifeCycleMain = getTestMountpoint("dnplifecycle-main");
const testMountpointDnpLifeCycleDep = getTestMountpoint("dnplifecycle-dep");

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

  const dnpNameMain = "main.dnp.dappnode.eth";
  const dnpNameDep = "dependency.dnp.dappnode.eth";
  const dnpNames = [dnpNameMain, dnpNameDep];
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
    name: dnpNameMain,
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
      external_vol: ["dependencydnpdappnodeeth_data:/usrdep"],
      ports: stringifyPortMappings(Object.values(portsMain))
    }
  };

  const dependencyManifest: ManifestWithImage = {
    name: dnpNameDep,
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
  const fileDataUrlMain = toDaraUrl(dnpNameMain); // The content of the test file is the name of the DNP
  const fileDataUrlDep = toDaraUrl(dnpNameDep);

  const userSettings: UserSettingsAllDnps = {
    [dnpNameMain]: {
      environment: {
        [dnpNameMain]: {
          [envsMain.ENV_TO_CHANGE.key]: envsMain.ENV_TO_CHANGE.newValue
        }
      },
      portMappings: {
        [dnpNameMain]: {
          [portsMain.two.portId]: String(portsMain.two.newHost)
        }
      },
      namedVolumeMountpoints: {
        [volumesMain.changeme.name]: volumesMain.changeme.newHost
      },
      fileUploads: {
        [dnpNameMain]: {
          [demoFilePath]: fileDataUrlMain
        }
      }
    },
    [dnpNameDep]: {
      environment: {
        [dnpNameDep]: {
          [envsDep.ENV_DEP_TO_CHANGE.key]: envsDep.ENV_DEP_TO_CHANGE.newValue
        }
      },
      portMappings: {
        [dnpNameDep]: {
          [portsDep.three.portId]: String(portsDep.three.newHost),
          [portsDep.four.portId]: String(portsDep.four.newHost)
        }
      },
      legacyBindVolumes: {
        [dnpNameDep]: {
          [volumesDep.changeme.name]: volumesDep.changeme.newHost
        }
      },
      fileUploads: {
        [dnpNameDep]: {
          [demoFilePath]: fileDataUrlDep
        }
      }
    }
  };

  let mainDnpReleaseHash: string;

  before("Clean environment", async () => {
    // Create necessary network
    await shellSafe("docker network create dncore_network");

    // Clean DB
    clearDbs();

    // Print out params
    logs.info("Test params", params);

    // SUPER important to clean dnp_repo folder to avoid caches
    await cleanRepos();
    await cleanContainers(...dnpNames);
  });

  after("Clean environment", async () => {
    // SUPER important to clean dnp_repo folder to avoid caches
    await cleanRepos();
    await cleanContainers(...dnpNames);
  });

  before(
    `Preparing releases for ${dnpNameMain} and ${dnpNameDep}`,
    async () => {
      // Prepare a package release with dependencies
      const dependencyUpload = await uploadManifestRelease(dependencyManifest);
      const mainDnpUpload = await uploadManifestRelease({
        ...mainDnpManifest,
        dependencies: {
          [dnpNameDep]: dependencyUpload.hash
        }
      });
      mainDnpReleaseHash = mainDnpUpload.hash;
    }
  );

  before("Should resolve a request", async () => {
    const result = await calls.fetchDnpRequest({
      id: mainDnpReleaseHash
    });
    expect(result.dnpName, "Wrong result name").to.equal(dnpNameMain);
    expect(result.request.compatible, "Result is not compatible").to.be.ok;
    expect(
      result.request.compatible.dnps,
      "Resolved state should include this dnp"
    ).to.have.property(dnpNameMain);
  });

  before("Should install DNP", async () => {
    await calls.packageInstall({
      name: dnpNameMain,
      version: mainDnpReleaseHash,
      userSettings
    });
  });

  // EXTRA, verify that the envs were set correctly
  describe("Should apply user settings on the installation", () => {
    let dnpMain: InstalledPackageData;
    let dnpDep: InstalledPackageData;

    before("Fetch DNPs", async () => {
      const _dnpMain = await getDnpFromListPackages(dnpNameMain);
      const _dnpDep = await getDnpFromListPackages(dnpNameDep);
      if (!_dnpMain) throw Error(`DNP ${dnpNameMain} not found`);
      if (!_dnpDep) throw Error(`DNP ${dnpNameDep} not found`);
      dnpMain = _dnpMain;
      dnpDep = _dnpDep;
      // Print status as a sanity check for test debugging
      logs.debug({ dnpMain, dnpDep });
    });

    it(`${dnpNameMain} environment`, async () => {
      await assertEnvironment(dnpNameMain, {
        [envsMain.ENV_TO_CHANGE.key]: envsMain.ENV_TO_CHANGE.newValue,
        [envsMain.ENV_DEFAULT.key]: envsMain.ENV_DEFAULT.value
      });
    });

    it(`${dnpNameMain} port mappings`, () => {
      const container = dnpMain.containers[0];
      const port1111 = container.ports.find(
        port => port.container === portsMain.one.container
      );
      const port2222 = container.ports.find(
        port => port.container === portsMain.two.container
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

    it(`${dnpNameMain} name volume paths`, () => {
      const container = dnpMain.containers[0];
      const changemeVolume = container.volumes.find(
        vol => vol.container === volumesMain.changeme.container
      );

      if (!changemeVolume) throw Error(`Volume changeme not found`);
      // Using this particular type of bind, the volume path in docker inspect
      // is the default var lib docker
      const dockerDefaultPath = path.join(
        "/var/lib/docker/volumes",
        `${dnpNameMain.replace(/\./g, "")}_${volumesMain.changeme.name}`,
        "_data"
      );
      expect(changemeVolume.host).to.equal(dockerDefaultPath);
    });

    it(`${dnpNameMain} fileuploads`, async () => {
      const result = await calls.copyFileFrom({
        containerName: dnpMain.containers[0].containerName,
        fromPath: demoFilePath
      });
      expect(result).to.equal(fileDataUrlMain);
    });

    it(`${dnpNameDep} environment`, async () => {
      await assertEnvironment(dnpNameDep, {
        [envsDep.ENV_DEP_TO_CHANGE.key]: envsDep.ENV_DEP_TO_CHANGE.newValue,
        [envsDep.ENV_DEP_DEFAULT.key]: envsDep.ENV_DEP_DEFAULT.value
      });
    });

    it(`${dnpNameDep} port mappings`, () => {
      const container = dnpDep.containers[0];
      // Change from ephemeral to a defined host port
      const port3333 = container.ports.find(
        port => port.container === portsDep.three.container
      );
      // Change from a defined host port to ephemeral
      const port4444 = container.ports.find(
        port => port.container === portsDep.four.container
      );

      // Make sure port 4444 is ephemeral
      if (!port4444) throw Error(`Port 4444 not found`);
      expect(port4444.host).to.be.a("number");
      expect(port4444.host).to.be.greaterThan(32768 - 1);
      // Make sure port 3333 is mapped
      if (!port3333) throw Error(`Port 3333 not found`);
      expect(port3333.host).to.equal(portsDep.three.newHost);
    });

    it(`${dnpNameDep} name volume paths`, () => {
      const container = dnpDep.containers[0];
      const changemeVolume = container.volumes.find(
        vol => vol.container === volumesDep.changeme.container
      );
      if (!changemeVolume) throw Error(`Volume changeme not found`);
      expect(changemeVolume.host).to.equal(volumesDep.changeme.newHost);
    });

    it(`${dnpNameDep} fileuploads`, async () => {
      const result = await calls.copyFileFrom({
        containerName: dnpDep.containers[0].containerName,
        fromPath: demoFilePath
      });
      expect(result).to.equal(fileDataUrlDep);
    });
  });

  // - > logPackage
  describe("Test logPackage", () => {
    let containerMain: PackageContainer;
    let containerDep: PackageContainer;

    before(`DNP should be running`, async () => {
      const _dnpMain = await getDnpFromListPackages(dnpNameMain);
      const _dnpDep = await getDnpFromListPackages(dnpNameDep);
      if (!_dnpMain) throw Error(`DNP ${dnpNameMain} not found`);
      if (!_dnpDep) throw Error(`DNP ${dnpNameDep} not found`);
      containerMain = _dnpMain.containers[0];
      containerDep = _dnpDep.containers[0];
      if (!containerMain.running) throw Error(`DNP ${dnpNameMain} not running`);
      if (!containerDep.running) throw Error(`DNP ${dnpNameDep} not running`);
    });

    it(`Should call logPackage for ${dnpNameMain}`, async () => {
      const result = await calls.packageLog({
        containerName: containerMain.containerName
      });
      expect(result).to.be.a("string");
    });

    it(`Should call logPackage for ${dnpNameDep}`, async () => {
      const result = await calls.packageLog({
        containerName: containerDep.containerName
      });
      expect(result).to.be.a("string");
    });
  });

  describe("Test updating the package state", () => {
    before(`DNP should be running`, async () => {
      const state = await getDnpState(dnpNameMain);
      expect(state).to.equal("running");
    });

    it("Should update DNP envs and reset", async () => {
      const dnpPrevEnvs = await getContainerEnvironment(dnpNameMain);

      // Use randomize value, different on each run
      const envValue = String(Date.now());
      await calls.packageSetEnvironment({
        dnpName: dnpNameMain,
        environment: { [dnpNameMain]: { time: envValue } }
      });

      const dnpNextEnvs = await getContainerEnvironment(dnpNameMain);
      expect(
        pick(dnpNextEnvs, ["time", ...Object.keys(dnpPrevEnvs)])
      ).to.deep.equal({
        ...dnpPrevEnvs,
        time: envValue
      });
    });

    it(`Should update the port mappings of ${dnpNameMain}`, async () => {
      const portNumber = 13131;
      const protocol = "TCP";
      const portMappings: PortMapping[] = [
        { host: portNumber, container: portNumber, protocol }
      ];
      await calls.packageSetPortMappings({
        dnpName: dnpNameMain,
        portMappingsByService: { [dnpNameMain]: portMappings }
      });

      const dnp = await getDnpFromListPackages(dnpNameMain);
      if (!dnp) throw Error(`${dnpNameMain} is not found running`);

      const addedPort = dnp.containers[0].ports.find(
        p => p.container === portNumber
      );
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
    let containerMain: PackageContainer;

    before(`DNP should be running`, async () => {
      const _dnpMain = await getDnpFromListPackages(dnpNameMain);
      if (!_dnpMain) throw Error(`DNP ${dnpNameMain} not found`);
      containerMain = _dnpMain.containers[0];
      if (!containerMain.running) throw Error(`DNP ${dnpNameMain} not running`);
    });

    it("Should stop the DNP", async () => {
      await calls.packageStartStop({
        containerName: containerMain.containerName,
        timeout: 0
      });
    });

    it(`DNP should be running`, async () => {
      const state = await getDnpState(dnpNameMain);
      expect(state).to.equal("exited");
    });

    it("Should start the DNP", async () => {
      await calls.packageStartStop({
        containerName: containerMain.containerName,
        timeout: 0
      });
    });

    it(`DNP should be running`, async () => {
      const state = await getDnpState(dnpNameMain);
      expect(state).to.equal("running");
    });

    it("Should restart the DNP", async () => {
      await calls.packageRestart({ dnpName: dnpNameMain });
    });

    it(`DNP should be running`, async () => {
      const state = await getDnpState(dnpNameMain);
      expect(state).to.equal("running");
    });
  });

  /**
   * Test the file transfer
   * - Copy to the container
   * - Copy from the container
   */

  describe("Test the file transfer", () => {
    let containerMain: PackageContainer;

    before(`DNP should be running`, async () => {
      const _dnpMain = await getDnpFromListPackages(dnpNameMain);
      if (!_dnpMain) throw Error(`DNP ${dnpNameMain} not found`);
      containerMain = _dnpMain.containers[0];
      if (!containerMain.running) throw Error(`DNP ${dnpNameMain} not running`);
    });

    it("Should copy the file TO the container", async () => {
      await calls.copyFileTo({
        containerName: containerMain.containerName,
        dataUri: sampleFile.dataUri,
        filename: sampleFile.filename,
        toPath: sampleFile.containerPath
      });
    });

    // WARNING: mime-types may not match
    it("Should copy the file FROM the container", async () => {
      const returnedDataUri = await calls.copyFileFrom({
        containerName: containerMain.containerName,
        fromPath: sampleFile.containerPath
      });
      expect(returnedDataUri).to.equal(sampleFile.dataUri, "Wrong dataUri");
    });
  });

  /**
   * Restart volumes
   */
  describe("Restart volumes", () => {
    // Main depends on the volume of dep, so main should be shutdown
    it(`Should restart the package volumes of ${dnpNameDep}`, async () => {
      const dnpMainPrev = await getDnpFromListPackages(dnpNameMain);
      await calls.packageRestartVolumes({ dnpName: dnpNameDep });
      const dnpMainNext = await getDnpFromListPackages(dnpNameMain);

      // To know if main was restarted check that the container is different
      if (!dnpMainPrev) throw Error(`DNP ${dnpNameMain} (prev) not found`);
      if (!dnpMainNext) throw Error(`DNP ${dnpNameMain} (next) not found`);
      const containerIdPrev = dnpMainPrev.containers[0].containerId;
      const containerIdNext = dnpMainNext.containers[0].containerId;

      expect(containerIdPrev).to.not.equal(
        containerIdNext,
        `${dnpNameMain} container ids are not different, so it was not reseted: ${containerIdPrev}`
      );
    });

    it(`Should restart the package volumes of ${dnpNameMain}`, async () => {
      await calls.packageRestartVolumes({ dnpName: dnpNameMain });
      // #### NOTE: The volume "maindnpdappnodeeth_changeme-main" will not be actually
      // removed but it's data will not. Only the reference in /var/lib/docker
      // is deleted
      // #### NOTE: order of the message is not guaranteed, check it by parts
      // Possible message: `Restarted ${dnpNameMain} volumes: maindnpdappnodeeth_changeme-main, maindnpdappnodeeth_data`
      // for (const messagePart of [
      //   dnpNameMain,
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
    before(`Should remove DNP ${dnpNameDep}`, async () => {
      await calls.packageRemove({ dnpName: dnpNameDep, deleteVolumes: true });
    });

    // Since main depends on a volume of main, it will removed at the same time
    // as dependency
    it(`DNP ${dnpNameDep} and ${dnpNameMain} should be removed`, async () => {
      const stateDep = await getDnpState(dnpNameDep);
      expect(stateDep).to.equal("down");
      const stateMain = await getDnpState(dnpNameMain);
      expect(stateMain).to.equal("down");
    });
  });
});

/**
 * Environment variables in a container
 * Note: Likely to include additional ENVs from the ones defined in the compose
 * @param containerNameOrId
 */
async function getContainerEnvironment(id: string): Promise<PackageEnvs> {
  const container = await listContainer(id);
  const containerData = await containerInspect(container.containerId);
  return parseEnvironment(containerData.Config.Env);
}

async function assertEnvironment(
  dnpName: string,
  expectedEnvs: PackageEnvs
): Promise<void> {
  const dnpDepEnvs = await getContainerEnvironment(dnpName);
  expect(pick(dnpDepEnvs, Object.keys(expectedEnvs))).to.deep.equal(
    expectedEnvs,
    `Wrong environment: ${JSON.stringify(expectedEnvs)}`
  );
}
