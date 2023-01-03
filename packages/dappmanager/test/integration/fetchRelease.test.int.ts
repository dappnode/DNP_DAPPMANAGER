import "mocha";
import { expect } from "chai";
import path from "path";
import { omit } from "lodash-es";
import { Manifest, SetupWizard } from "@dappnode/dappnodesdk";
import * as calls from "../../src/calls";
import { ManifestWithImage } from "../../src/types";
import {
  getTestMountpoint,
  clearDbs,
  createTestDir,
  cleanRepos,
  cleanContainers,
  shellSafe
} from "../testUtils";
import {
  uploadManifestRelease,
  uploadDirectoryRelease
} from "./integrationSpecs";
import shell from "../../src/utils/shell";
import * as validate from "../../src/utils/validate";
import { dockerComposeUp } from "../../src/modules/docker/compose";
import { ComposeEditor } from "../../src/modules/compose/editor";
import { writeDefaultsToLabels } from "../../src/modules/compose";
import { getContainerName, getImageTag } from "../../src/params";
import { RequestedDnp } from "@dappnode/common";

describe("Fetch releases", () => {
  // This mountpoints have files inside created by docker with the root
  // user group, so they can't be cleaned by other tests.
  // #### TODO: While a better solution is found, each test will use a separate dir
  const testMountpointfetchMain = getTestMountpoint("fetch-main");
  const testMountpointfetchMountpoint = getTestMountpoint("fetch-mountpoint");

  const dnpNameMain = "main.dnp.dappnode.eth";
  const dnpNameDep = "dependency.dnp.dappnode.eth";
  const dnpNames = [dnpNameMain, dnpNameDep];
  const mainVersion = "0.1.0";
  const depVersion = "0.0.1";

  before("Clean repos", async () => {
    await cleanRepos();
  });

  before("Clear DBs and set remote", async () => {
    clearDbs();
    // Activate remote and fallback to fetch test data without a local node
    await calls.ethClientFallbackSet({ fallback: "on" });
    await calls.ethClientTargetSet({ target: "remote" });
  });

  before("Create releases dir", async () => {
    await createTestDir();
  });

  beforeEach("Clean container and volumes", async () => {
    await cleanContainers(...dnpNames);
  });

  after("Clean container and volumes", async () => {
    await cleanContainers(...dnpNames);
  });

  describe("fetchDnpRequest with dependencies (manifest release)", () => {
    const customVolumePath = path.resolve(testMountpointfetchMain, "dev1");
    const mountpoint = path.resolve(testMountpointfetchMountpoint, "dev0");
    const customMountpoint = `${mountpoint}/dappnode-volumes/main.dnp.dappnode.eth/data0`;

    // Manifest fetched from IPFS
    const mainDnpManifest: ManifestWithImage = {
      name: dnpNameMain,
      version: mainVersion,
      description: "Main DNP",
      type: "service",
      license: "GPL-3.0",
      avatar: "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt",
      image: {
        hash: "",
        size: 0,
        path: "",
        environment: ["ENV_DEFAULT=ORIGINAL"],
        volumes: ["data0:/usr0", "data1:/usr1", "data2:/usr2"],
        ports: ["1111:1111"]
      },
      setupWizard: {
        version: "2",
        fields: [
          {
            id: "payoutAddress",
            target: { type: "environment", name: "PAYOUT_ADDRESS" },
            title: "Payout address",
            description: "Payout address description"
          }
        ]
      }
    };

    // Manifest fetched from IPFS
    const dependencyManifest: ManifestWithImage = {
      name: dnpNameDep,
      version: depVersion,
      image: {
        hash: "",
        size: 0,
        path: "",
        environment: ["DEP_ENV=DEP_ORIGINAL"],
        volumes: ["data:/usr"],
        ports: ["2222:2222"]
      },
      setupWizard: {
        version: "2",
        fields: [
          {
            id: "dependencyVar",
            target: { type: "environment", name: "DEP_VAR" },
            title: "Dependency var",
            description: "Dependency var description"
          }
        ]
      }
    };

    // Compose fetched from disk, from previously installed version
    const composeMain = new ComposeEditor({
      version: "3.5",
      services: {
        [dnpNameMain]: {
          container_name: getContainerName({
            dnpName: dnpNameMain,
            serviceName: dnpNameMain,
            isCore: false
          }),
          image: getImageTag({
            dnpName: dnpNameMain,
            serviceName: dnpNameMain,
            version: mainVersion
          }),
          environment: { PREVIOUS_SET: "PREV_VAL" },
          volumes: ["data0:/usr0", `${customVolumePath}:/usr1`],
          labels: writeDefaultsToLabels({
            environment: {},
            ports: [],
            volumes: ["data0:/usr0", "data1:/usr1"]
          })
        }
      },
      volumes: {
        data0: {
          driver_opts: {
            device: customMountpoint,
            o: "bind",
            type: "none"
          }
        },
        data1: {}
      }
    });

    it("Fetch manifest release with depedencies", async () => {
      // Create releases
      const dependencyReleaseHash = await uploadManifestRelease(
        dependencyManifest
      );
      const mainDnpReleaseHash = await uploadManifestRelease({
        ...mainDnpManifest,
        dependencies: {
          [dnpNameDep]: dependencyReleaseHash
        }
      });

      // Up mock docker packages
      const composePathMain = ComposeEditor.getComposePath(dnpNameMain, false);
      composeMain.writeTo(composePathMain);
      await shell(`mkdir -p ${customMountpoint}`); // Create the mountpoint for the bind volume
      await dockerComposeUp(composePathMain);

      // Actual test, fetch data
      const result = await calls.fetchDnpRequest({ id: mainDnpReleaseHash });

      const expectRequestDnp: RequestedDnp = {
        dnpName: dnpNameMain,
        reqVersion: mainDnpReleaseHash,
        semVersion: mainVersion,
        origin: mainDnpReleaseHash,
        avatarUrl: "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt",
        metadata: {
          name: dnpNameMain,
          version: mainVersion,
          dependencies: {
            [dnpNameDep]: dependencyReleaseHash
          },
          description: "Main DNP",
          license: "GPL-3.0",
          type: "service"
        },
        specialPermissions: {
          [dnpNameDep]: [],
          [dnpNameMain]: []
        },

        setupWizard: {
          [dnpNameMain]: {
            version: "2",
            fields: [
              {
                id: "payoutAddress",
                target: { type: "environment", name: "PAYOUT_ADDRESS" },
                title: "Payout address",
                description: "Payout address description"
              }
            ]
          },
          [dnpNameDep]: {
            version: "2",
            fields: [
              {
                id: "dependencyVar",
                target: { type: "environment", name: "DEP_VAR" },
                title: "Dependency var",
                description: "Dependency var description"
              }
            ]
          }
        },

        // Ignore in result checking, not relevant
        imageSize: NaN,

        isUpdated: false,
        isInstalled: true,
        settings: {
          [dnpNameMain]: {
            environment: {
              [dnpNameMain]: {
                ENV_DEFAULT: "ORIGINAL",
                PREVIOUS_SET: "PREV_VAL"
              }
            },
            portMappings: {
              [dnpNameMain]: { "1111/TCP": "1111" }
            },
            namedVolumeMountpoints: {
              data0: mountpoint,
              data1: "",
              data2: ""
            },
            legacyBindVolumes: {
              [dnpNameMain]: { data1: customVolumePath }
            }
          },
          [dnpNameDep]: {
            environment: {
              [dnpNameDep]: { DEP_ENV: "DEP_ORIGINAL" }
            },
            portMappings: {
              [dnpNameDep]: { "2222/TCP": "2222" }
            },
            namedVolumeMountpoints: {
              data: ""
            }
          }
        },
        compatible: {
          requiresCoreUpdate: false,
          resolving: false,
          isCompatible: true,
          error: "",
          dnps: {
            [dnpNameDep]: { from: undefined, to: dependencyReleaseHash },
            [dnpNameMain]: { from: mainVersion, to: mainDnpReleaseHash }
          }
        },
        available: {
          isAvailable: true,
          message: ""
        },
        signedSafeAll: false,
        signedSafe: {
          [dnpNameMain]: { safe: false, message: "Unsafe origin, not signed" },
          [dnpNameDep]: { safe: false, message: "Unsafe origin, not signed" }
        }
      };

      // Ignore in result checking, not relevant
      result.imageSize = NaN;
      expectRequestDnp.imageSize = NaN;
      expect(result).to.deep.equal(expectRequestDnp);
    });
  });

  describe("fetchDnpRequest with misc files (directory release)", () => {
    const mainDnpManifest: Manifest = {
      name: dnpNameMain,
      version: mainVersion,
      description: "Main DNP",
      license: "GPL-3.0",
      type: "service",
      avatar: "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt"
    };

    const composeMain = new ComposeEditor({
      version: "3.5",
      services: {
        [dnpNameMain]: {
          container_name: getContainerName({
            dnpName: dnpNameMain,
            serviceName: dnpNameMain,
            isCore: false
          }),
          image: getImageTag({
            dnpName: dnpNameMain,
            serviceName: dnpNameMain,
            version: mainVersion
          })
        }
      }
    });

    const setupWizard: SetupWizard = {
      version: "2",
      fields: [
        {
          id: "mockVar",
          target: { type: "environment", name: "MOCK_VAR" },
          title: "Mock var",
          description: "Mock var description"
        }
      ]
    };

    const disclaimer = "Warning!\n\nThis is really dangerous";

    it("Fetch directory release", async () => {
      // Create release
      const mainDnpReleaseHash = await uploadDirectoryRelease({
        manifest: mainDnpManifest,
        compose: composeMain.output(),
        setupWizard,
        disclaimer
      });

      // Up mock docker packages
      const composePathMain = ComposeEditor.getComposePath(dnpNameMain, false);
      validate.path(composePathMain);
      composeMain.writeTo(composePathMain);
      await dockerComposeUp(composePathMain);

      // Actual test, fetch data
      const result = await calls.fetchDnpRequest({ id: mainDnpReleaseHash });

      const expectRequestDnp: RequestedDnp = {
        dnpName: dnpNameMain,
        reqVersion: mainDnpReleaseHash,
        semVersion: mainVersion,
        origin: mainDnpReleaseHash,
        avatarUrl: "/ipfs/QmQZ9sohpdB7NDDXcPfuPtpJ5TrMGxLWATpQUiaifUhrd2",
        metadata: {
          description: "Main DNP",
          license: "GPL-3.0",
          name: dnpNameMain,
          version: mainVersion,
          type: "service",
          disclaimer: {
            message: disclaimer
          }
        },
        specialPermissions: { [dnpNameMain]: [] },

        // Data added via files, to be tested
        setupWizard: { [dnpNameMain]: setupWizard },

        isUpdated: false,
        isInstalled: true,
        settings: {
          [dnpNameMain]: {}
        },
        compatible: {
          requiresCoreUpdate: false,
          resolving: false,
          isCompatible: true,
          error: "",
          dnps: {
            [dnpNameMain]: { from: mainVersion, to: mainDnpReleaseHash }
          }
        },
        available: {
          isAvailable: true,
          message: ""
        },
        // Mock, ommited below
        imageSize: 0,
        signedSafeAll: false,
        signedSafe: {
          [dnpNameMain]: { safe: false, message: "Unsafe origin, not signed" }
        }
      };

      expect(omit(result, ["imageSize"])).to.deep.equal(
        omit(expectRequestDnp, ["imageSize"])
      );

      after(async () => {
        await shellSafe(`docker-compose -f ${composePathMain} down -v`);
      });
    });
  });
});
