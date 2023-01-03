import "mocha";
import { expect } from "chai";
import path from "path";
import { Compose, Manifest, PackageEnvs } from "@dappnode/dappnodesdk";
import { mapValues, pick } from "lodash-es";
import * as calls from "../../src/calls";
import params from "../../src/params";
import { logs } from "../../src/logs";
import { getDnpFromListPackages, getDnpState } from "./testPackageUtils";
import {
  PortMapping,
  UserSettingsAllDnps,
  PackageContainer,
  InstalledPackageData,
  PortProtocol
} from "@dappnode/common";
import {
  clearDbs,
  getTestMountpoint,
  shellSafe,
  cleanRepos,
  cleanContainers,
  sampleFile
} from "../testUtils";
import {
  stringifyPortMappings,
  parseEnvironment
} from "../../src/modules/compose";
import {
  dockerContainerInspect,
  dockerGetArchiveSingleFile
} from "../../src/modules/docker/api";
import { listContainer } from "../../src/modules/docker/list";
import { uploadDirectoryRelease } from "./integrationSpecs";
import { MemoryWritable } from "./testStreamUtils";

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
describe("DNP lifecycle", function () {
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
      protocol: PortProtocol.UDP,
      newHost: 1111
    },
    // Change from a host port to a different
    two: {
      host: 2222,
      container: 2222,
      protocol: PortProtocol.TCP,
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
      protocol: PortProtocol.UDP,
      newHost: 3330
    },
    // Change from a defined host port to ephemeral
    four: {
      host: 4444,
      container: 4444,
      protocol: PortProtocol.TCP,
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
  const staticVolume = {
    name: "data",
    container: "/usr"
  };

  const manifestMain: Manifest = {
    name: dnpNameMain,
    description: "Main DNP",
    type: "service",
    license: "GPL-3.0",
    version: "0.1.0"
  };
  const composeMain: Compose = {
    version: "3.5",
    services: {
      [dnpNameMain]: {
        container_name: "",
        image: "",
        environment: toEnvironment(envsMain),
        volumes: [
          `${staticVolume.name}:${staticVolume.container}`,
          `${volumesMain.changeme.name}:${volumesMain.changeme.container}`
        ],
        ports: stringifyPortMappings(Object.values(portsMain))
      }
    },
    volumes: {
      [staticVolume.name]: {},
      [volumesMain.changeme.name]: {}
    }
  };

  const manifestDep: Manifest = {
    name: dnpNameDep,
    description: "Main DNP",
    type: "service",
    license: "GPL-3.0",
    version: "0.1.0"
  };
  const composeDep: Compose = {
    version: "3.5",
    services: {
      [dnpNameDep]: {
        container_name: "",
        image: "",
        environment: toEnvironment(envsDep),
        volumes: [
          `${staticVolume.name}:${staticVolume.container}`,
          `${volumesDep.changeme.name}:${volumesDep.changeme.container}`
        ],
        ports: stringifyPortMappings(Object.values(portsDep))
      }
    },
    volumes: {
      [staticVolume.name]: {},
      [volumesDep.changeme.name]: {}
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
    await shellSafe("docker network rm dncore_network");
  });

  before(
    `Preparing releases for ${dnpNameMain} and ${dnpNameDep}`,
    async () => {
      // Prepare a package release with dependencies
      const depDnpReleaseHash = await uploadDirectoryRelease({
        manifest: manifestDep,
        compose: composeDep
      });
      mainDnpReleaseHash = await uploadDirectoryRelease({
        manifest: {
          ...manifestMain,
          dependencies: { [dnpNameDep]: depDnpReleaseHash }
        },
        compose: composeMain
      });
    }
  );

  before("Should resolve a request", async () => {
    const result = await calls.fetchDnpRequest({
      id: mainDnpReleaseHash
    });
    console.log(result);
    expect(result.dnpName, "Wrong result name").to.equal(dnpNameMain);
    expect(result.compatible, "Result is not compatible").to.be.ok;
    expect(
      result.compatible.dnps,
      "Resolved state should include this dnp"
    ).to.have.property(dnpNameMain);
  });

  before("Should install DNP", async () => {
    await calls.packageInstall({
      name: dnpNameMain,
      version: mainDnpReleaseHash,
      userSettings,
      options: { BYPASS_SIGNED_RESTRICTION: true }
    });
  });

  // EXTRA, verify that the envs were set correctly
  describe("Should apply user settings on the installation", () => {
    let dnpMain: InstalledPackageData;
    let dnpDep: InstalledPackageData;
    let containerMain: PackageContainer;
    let containerDep: PackageContainer;

    before("Fetch DNPs", async () => {
      const _dnpMain = await getDnpFromListPackages(dnpNameMain);
      const _dnpDep = await getDnpFromListPackages(dnpNameDep);
      if (!_dnpMain) throw Error(`DNP ${dnpNameMain} not found`);
      if (!_dnpDep) throw Error(`DNP ${dnpNameDep} not found`);
      dnpMain = _dnpMain;
      dnpDep = _dnpDep;
      containerMain = dnpMain.containers[0];
      containerDep = dnpDep.containers[0];
      // Print status as a sanity check for test debugging
      logs.debug({ dnpMain, dnpDep });
    });

    it(`${dnpNameMain} environment`, async () => {
      await assertEnvironment(
        { containerName: containerMain.containerName },
        {
          [envsMain.ENV_TO_CHANGE.key]: envsMain.ENV_TO_CHANGE.newValue,
          [envsMain.ENV_DEFAULT.key]: envsMain.ENV_DEFAULT.value
        }
      );
    });

    it(`${dnpNameMain} port mappings`, () => {
      const port1111 = containerMain.ports.find(
        port => port.container === portsMain.one.container
      );
      const port2222 = containerMain.ports.find(
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
      const changemeVolume = containerMain.volumes.find(
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
      const result = await copyFileFrom({
        containerName: containerMain.containerName,
        fromPath: demoFilePath
      });
      expect(toDaraUrl(result)).to.equal(fileDataUrlMain);
    });

    it(`${dnpNameDep} environment`, async () => {
      await assertEnvironment(
        { containerName: containerDep.containerName },
        {
          [envsDep.ENV_DEP_TO_CHANGE.key]: envsDep.ENV_DEP_TO_CHANGE.newValue,
          [envsDep.ENV_DEP_DEFAULT.key]: envsDep.ENV_DEP_DEFAULT.value
        }
      );
    });

    it(`${dnpNameDep} port mappings`, () => {
      // Change from ephemeral to a defined host port
      const port3333 = containerDep.ports.find(
        port => port.container === portsDep.three.container
      );
      // Change from a defined host port to ephemeral
      const port4444 = containerDep.ports.find(
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
      const changemeVolume = containerDep.volumes.find(
        vol => vol.container === volumesDep.changeme.container
      );
      if (!changemeVolume) throw Error(`Volume changeme not found`);
      expect(changemeVolume.host).to.equal(volumesDep.changeme.newHost);
    });

    it(`${dnpNameDep} fileuploads`, async () => {
      const result = await copyFileFrom({
        containerName: containerDep.containerName,
        fromPath: demoFilePath
      });
      expect(toDaraUrl(result)).to.equal(fileDataUrlDep);
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
    let containerMain: PackageContainer;

    before(`DNP should be running`, async () => {
      const _dnpMain = await getDnpFromListPackages(dnpNameMain);
      if (!_dnpMain) throw Error(`DNP ${dnpNameMain} not found`);
      containerMain = _dnpMain.containers[0];
      if (!containerMain.running) throw Error(`DNP ${dnpNameMain} not running`);
    });

    it("Should update DNP envs and reset", async () => {
      const dnpPrevEnvs = await getContainerEnvironment({
        containerName: containerMain.containerName
      });

      // Use randomize value, different on each run
      const envValue = String(Date.now());
      await calls.packageSetEnvironment({
        dnpName: dnpNameMain,
        environmentByService: { [dnpNameMain]: { time: envValue } }
      });

      const dnpNextEnvs = await getContainerEnvironment({
        containerName: containerMain.containerName
      });
      expect(
        pick(dnpNextEnvs, ["time", ...Object.keys(dnpPrevEnvs)])
      ).to.deep.equal({
        ...dnpPrevEnvs,
        time: envValue
      });
    });

    it(`Should update the port mappings of ${dnpNameMain}`, async () => {
      const portNumber = 13131;
      const protocol = PortProtocol.TCP;
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
      await calls.packageStartStop({ dnpName: dnpNameMain });
    });

    it(`DNP should be running`, async () => {
      const state = await getDnpState(dnpNameMain);
      expect(state).to.equal("exited");
    });

    it("Should start the DNP", async () => {
      await calls.packageStartStop({ dnpName: dnpNameMain });
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
      const result = await copyFileFrom({
        containerName: containerMain.containerName,
        fromPath: sampleFile.containerPath
      });
      expect(toDaraUrl(result)).to.equal(sampleFile.dataUri, "Wrong dataUri");
    });
  });

  /**
   * Restart volumes
   */
  describe("Restart volumes", () => {
    for (const dnpName of [dnpNameMain, dnpNameDep]) {
      it(`Should restart the package volumes of ${dnpName}`, async () => {
        const dnpPrev = await getDnpFromListPackages(dnpName);
        await calls.packageRestartVolumes({ dnpName });
        const dnpNext = await getDnpFromListPackages(dnpName);

        // To know if main was restarted check that the container is different
        if (!dnpPrev) throw Error(`DNP ${dnpName} (prev) not found`);
        if (!dnpNext) throw Error(`DNP ${dnpName} (next) not found`);
        const containerIdPrev = dnpPrev.containers[0].containerId;
        const containerIdNext = dnpNext.containers[0].containerId;

        expect(containerIdPrev).to.not.equal(
          containerIdNext,
          `${dnpName} container ids are not different, so it was not reseted: ${containerIdPrev}`
        );
      });
    }
  });

  /**
   * Remove packages
   */
  describe("Remove packages", () => {
    for (const dnpName of [dnpNameMain, dnpNameDep]) {
      it(`Should remove DNP ${dnpName}`, async () => {
        await calls.packageRemove({ dnpName, deleteVolumes: true });
        const state = await getDnpState(dnpName);
        expect(state).to.equal("down");
      });
    }
  });
});

/**
 * Environment variables in a container
 * Note: Likely to include additional ENVs from the ones defined in the compose
 * @param containerNameOrId
 */
async function getContainerEnvironment({
  containerName
}: {
  containerName: string;
}): Promise<PackageEnvs> {
  const container = await listContainer({ containerName });
  const containerData = await dockerContainerInspect(container.containerId);
  return parseEnvironment(containerData.Config.Env);
}

async function assertEnvironment(
  { containerName }: { containerName: string },
  expectedEnvs: PackageEnvs
): Promise<void> {
  const dnpDepEnvs = await getContainerEnvironment({ containerName });
  expect(pick(dnpDepEnvs, Object.keys(expectedEnvs))).to.deep.equal(
    expectedEnvs,
    `Wrong environment: ${JSON.stringify(expectedEnvs)}`
  );
}

/**
 * Copy file from container as UTF8 (not base64 encoded)
 * @param containerName
 * @param filepath
 */
async function copyFileFrom({
  containerName,
  fromPath
}: {
  containerName: string;
  fromPath: string;
}): Promise<string> {
  const sink = new MemoryWritable<Buffer>();
  await dockerGetArchiveSingleFile(containerName, fromPath, sink);

  const resultBuffer = Buffer.concat(sink.chunks);
  return resultBuffer.toString("utf8");
}
