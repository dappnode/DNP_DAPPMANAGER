import "mocha";
import { expect } from "chai";
import path from "path";
import { omit } from "lodash";
import * as calls from "../../src/calls";
import {
  ManifestWithImage,
  Compose,
  RequestedDnp,
  Manifest,
  SetupWizard
} from "../../src/types";
import {
  getTestMountpoint,
  clearDbs,
  createTestDir,
  mockComposeService,
  mockCompose
} from "../testUtils";
import {
  uploadManifestRelease,
  uploadDirectoryRelease
} from "../testReleaseUtils";
import shell from "../../src/utils/shell";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import params from "../../src/params";
import { writeComposeObj } from "../../src/utils/dockerComposeFile";
import { dockerComposeUp } from "../../src/modules/docker/dockerCommands";
import { writeDefaultsToLabels } from "../../src/utils/containerLabelsDb";
import { legacyTag } from "../../src/utils/dockerComposeParsers";

const mockImage = "mock-test.public.dappnode.eth:0.0.1";
const containerCoreNamePrefix = params.CONTAINER_CORE_NAME_PREFIX;

// This mountpoints have files inside created by docker with the root
// user group, so they can't be cleaned by other tests.
// #### TODO: While a better solution is found, each test will use a separate dir
const testMountpointfetchMain = getTestMountpoint("fetch-main");
const testMountpointfetchMountpoint = getTestMountpoint("fetch-mountpoint");

describe("Fetch external release data", () => {
  before(async () => {
    clearDbs();
  });

  const bindId = "bind.dnp.dappnode.eth";
  const bitcoinId = "bitcoin.dnp.dappnode.eth";

  describe("fetchDnpRequest with dependencies (manifest release)", () => {
    const idMain = "main.dnp.dappnode.eth";
    const idDep = "dependency.dnp.dappnode.eth";
    const containerNameMain = `${containerCoreNamePrefix}${idMain}`;
    const customVolumePath = path.resolve(testMountpointfetchMain, "dev1");
    const mountpoint = path.resolve(testMountpointfetchMountpoint, "dev0");
    const customMountpoint = `${mountpoint}/dappnode-volumes/main.dnp.dappnode.eth/data0`;

    // Manifest fetched from IPFS
    const mainDnpManifest: ManifestWithImage = {
      name: idMain,
      version: "0.1.0",
      avatar: "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt",
      image: {
        hash: "",
        size: 0,
        path: "",
        environment: ["ENV_DEFAULT=ORIGINAL"],
        volumes: ["data0/usr0", "data1:/usr1", "data2:/usr2"],
        /* eslint-disable-next-line @typescript-eslint/camelcase */
        external_vol: ["dependencydnpdappnodeeth_data:/usrdep"],
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
      name: idDep,
      version: "0.1.0",
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
    const composeMain: Compose = {
      ...mockCompose,
      services: {
        [idMain]: {
          ...mockComposeService,
          /* eslint-disable-next-line @typescript-eslint/camelcase */
          container_name: containerNameMain,
          image: mockImage,
          environment: ["PREVIOUS_SET=PREV_VAL"],
          volumes: ["data0:/usr0", `${customVolumePath}:/usr1`],
          labels: writeDefaultsToLabels({
            defaultEnvironment: [],
            defaultPorts: [],
            defaultVolumes: ["data0:/usr0", "data1:/usr1"]
          })
        }
      },
      volumes: {
        data0: {
          /* eslint-disable-next-line @typescript-eslint/camelcase */
          driver_opts: {
            device: customMountpoint,
            o: "bind",
            type: "none"
          }
        },
        data1: {}
      }
    };

    async function cleanArtifacts(): Promise<void> {
      for (const cmd of [
        `docker rm -f ${containerNameMain}`,
        `docker volume rm -f $(docker volume ls --filter name=maindnpdappnodeeth_ -q)`,
        `docker volume rm -f $(docker volume ls --filter name=dependencydnpdappnodeeth_ -q)`
      ])
        await shell(cmd).catch(() => {});
    }

    let mainDnpReleaseHash: string;
    let mainDnpImageSize: number;
    let dependencyReleaseHash: string;

    before("Create releases", async () => {
      await createTestDir();

      const depUpload = await uploadManifestRelease(dependencyManifest);
      const mainUpload = await uploadManifestRelease({
        ...mainDnpManifest,
        dependencies: {
          [idDep]: depUpload.hash
        }
      });

      dependencyReleaseHash = depUpload.hash;
      mainDnpReleaseHash = mainUpload.hash;
      mainDnpImageSize = mainUpload.imageSize;
    });

    before("Up mock docker packages", async () => {
      await cleanArtifacts();

      const composePathMain = getPath.dockerCompose(idMain, false);
      validate.path(composePathMain);
      writeComposeObj(composePathMain, composeMain);
      // Create the custom mountpoint for the bind volume
      await shell(`mkdir -p ${customMountpoint}`);
      await dockerComposeUp(composePathMain);
    });

    it("Fetch regular package data", async () => {
      const res = await calls.fetchDnpRequest({
        id: mainDnpReleaseHash
      });

      const expectRequestDnp: RequestedDnp = {
        name: idMain,
        reqVersion: mainDnpReleaseHash,
        semVersion: "0.1.0",
        origin: mainDnpReleaseHash,
        avatarUrl:
          "http://ipfs.dappnode:8080/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt",
        metadata: {
          name: idMain,
          version: "0.1.0",
          dependencies: {
            [idDep]: dependencyReleaseHash
          },
          type: "service"
        },
        specialPermissions: [
          {
            details:
              "Allows the DAppNode Package to read and write to the volume dependencydnpdappnodeeth_data",
            name: "Access to DAppNode Package volume"
          }
        ],

        setupWizard: {
          [idMain]: {
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
          [idDep]: {
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

        imageSize: mainDnpImageSize,
        isUpdated: false,
        isInstalled: true,
        settings: {
          [idMain]: {
            environment: {
              ENV_DEFAULT: "ORIGINAL",
              PREVIOUS_SET: "PREV_VAL"
            },
            portMappings: {
              "1111/TCP": "1111"
            },
            namedVolumeMountpoints: {
              data0: mountpoint,
              data2: "",
              // ##### DEPRECATED
              data1: legacyTag + customVolumePath
            }
          },
          [idDep]: {
            environment: {
              DEP_ENV: "DEP_ORIGINAL"
            },
            portMappings: {
              "2222/TCP": "2222"
            },
            namedVolumeMountpoints: {
              data: ""
            }
          }
        },
        request: {
          compatible: {
            requiresCoreUpdate: false,
            resolving: false,
            isCompatible: true,
            error: "",
            dnps: {
              [idDep]: { from: undefined, to: dependencyReleaseHash },
              [idMain]: { from: "0.0.1", to: mainDnpReleaseHash }
            }
          },
          available: {
            isAvailable: true,
            message: ""
          }
        }
      };

      expect(res.result).to.deep.equal(expectRequestDnp);
    });

    after("Clean artifcats", async () => {
      await cleanArtifacts();
    });
  });

  describe("fetchDnpRequest with misc files (directory release)", () => {
    const idMain = "main.dnp.dappnode.eth";
    const containerNameMain = `${containerCoreNamePrefix}${idMain}`;

    const mainDnpManifest: Manifest = {
      name: idMain,
      version: "0.1.0",
      avatar: "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt"
    };

    const composeMain: Compose = {
      ...mockCompose,
      services: {
        [idMain]: {
          ...mockComposeService,
          /* eslint-disable-next-line @typescript-eslint/camelcase */
          container_name: containerNameMain,
          image: mockImage
        }
      }
    };

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

    async function cleanArtifacts(): Promise<void> {
      await shell(`docker rm -f ${containerNameMain}`).catch(() => {});
    }

    let mainDnpReleaseHash: string;

    before("Create releases", async () => {
      await createTestDir();

      mainDnpReleaseHash = await uploadDirectoryRelease({
        manifest: mainDnpManifest,
        compose: composeMain,
        setupWizard,
        disclaimer
      });
    });

    before("Up mock docker packages", async () => {
      await cleanArtifacts();

      const composePathMain = getPath.dockerCompose(idMain, false);
      validate.path(composePathMain);
      writeComposeObj(composePathMain, composeMain);
      await dockerComposeUp(composePathMain);
    });

    it("Fetch package data", async () => {
      const res = await calls.fetchDnpRequest({
        id: mainDnpReleaseHash
      });

      const expectRequestDnp: RequestedDnp = {
        name: idMain,
        reqVersion: mainDnpReleaseHash,
        semVersion: "0.1.0",
        origin: mainDnpReleaseHash,
        avatarUrl:
          "http://ipfs.dappnode:8080/ipfs/QmYZkQjhSoqyq9mTaK3FiT3MDcrFDvEwQvzMGWW6f1nHGm",
        metadata: {
          name: idMain,
          version: "0.1.0",
          type: "service",
          disclaimer: {
            message: disclaimer
          }
        },
        specialPermissions: [],

        // Data added via files, to be tested
        setupWizard: { [idMain]: setupWizard },

        isUpdated: false,
        isInstalled: true,
        settings: {
          [idMain]: {
            environment: {},
            portMappings: {},
            namedVolumeMountpoints: {}
          }
        },
        request: {
          compatible: {
            requiresCoreUpdate: false,
            resolving: false,
            isCompatible: true,
            error: "",
            dnps: {
              [idMain]: { from: "0.0.1", to: mainDnpReleaseHash }
            }
          },
          available: {
            isAvailable: true,
            message: ""
          }
        },
        // Mock, ommited below
        imageSize: 0
      };

      expect(omit(res.result, ["imageSize"])).to.deep.equal(
        omit(expectRequestDnp, ["imageSize"])
      );
    });

    after("Clean artifcats", async () => {
      await cleanArtifacts();
    });
  });

  describe("fetchCoreUpdateData", () => {
    it("Should fetch core update data", async () => {
      const { result } = await calls.fetchCoreUpdateData({});
      expect(result.available, "Core update should be available").to.be.true;
      const dnpBind = result.packages.find(({ name }) => name === bindId);
      expect(dnpBind, "Bind DNP must be in packages array").to.be.ok;
    });
  });

  describe("fetchDirectory", () => {
    it("Should fetch directory data", async () => {
      const { result: directoryDnps } = await calls.fetchDirectory();
      expect(directoryDnps).to.have.length.greaterThan(
        0,
        "There should be packages in the directory return"
      );
      // Make sure the bitcoin DNP is there
      const dnpBitcoin = directoryDnps.find(({ name }) => name === bitcoinId);
      expect(dnpBitcoin, "Bitcoin DNP should be in directory array").to.be.ok;

      // Make sure that if there's a featured package it's first
      const isThereFeatured = directoryDnps.some(dnp => dnp.isFeatured);
      if (isThereFeatured) {
        expect(
          directoryDnps[0].isFeatured,
          "Wrong order: first package should be featured"
        ).to.be.true;
      }
    });
  });
});
