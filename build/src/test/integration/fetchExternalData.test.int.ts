import "mocha";
import { expect } from "chai";
import * as calls from "../../src/calls";
import { ManifestWithImage, Compose, RequestedDnp } from "../../src/types";
import {
  clearDbs,
  createTestDir,
  mockComposeService,
  mockCompose
} from "../testUtils";
import { prepareManifestTypeRelease } from "../testReleaseUtils";
import shell from "../../src/utils/shell";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import params from "../../src/params";
import { writeComposeObj } from "../../src/utils/dockerComposeFile";
import { dockerComposeUp } from "../../src/modules/docker/dockerCommands";

const mockImage = "mock-test.public.dappnode.eth:0.0.1";
const containerCoreNamePrefix = params.CONTAINER_CORE_NAME_PREFIX;

describe("Fetch external release data", () => {
  before(async () => {
    clearDbs();
  });

  const bindId = "bind.dnp.dappnode.eth";
  const bitcoinId = "bitcoin.dnp.dappnode.eth";

  describe("fetchDnpRequest", () => {
    const idMain = "main.dnp.dappnode.eth";
    const idDep = "dependency.dnp.dappnode.eth";
    const containerNameMain = `${containerCoreNamePrefix}${idMain}`;

    const mainDnpManifest: ManifestWithImage = {
      name: idMain,
      version: "0.1.0",
      avatar: "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt",
      image: {
        hash: "",
        size: 0,
        path: "",
        environment: ["ENV_DEFAULT=ORIGINAL"],
        volumes: ["data:/usr"],
        /* eslint-disable-next-line @typescript-eslint/camelcase */
        external_vol: ["dependencydnpdappnodeeth_data:/usrdep"],
        ports: ["1111:1111"]
      },
      setupSchema: {
        type: "object",
        properties: { payoutAddress: { type: "string" } }
      },
      setupUiSchema: { payoutAddress: { "ui:help": "Special help text" } }
    };

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
      setupSchema: {
        type: "object",
        properties: { dependencyVar: { type: "string" } }
      },
      setupUiSchema: { dependencyVar: { "ui:help": "Special help text" } }
    };

    const composeMain: Compose = {
      ...mockCompose,
      services: {
        [idMain]: {
          ...mockComposeService,
          /* eslint-disable-next-line @typescript-eslint/camelcase */
          container_name: containerNameMain,
          image: mockImage,
          environment: ["PREVIOUS_SET=PREV_VAL"]
        }
      }
    };

    let mainDnpReleaseHash: string;
    let dependencyReleaseHash: string;

    before("Create releases", async () => {
      await createTestDir();

      dependencyReleaseHash = await prepareManifestTypeRelease(
        dependencyManifest
      );
      mainDnpReleaseHash = await prepareManifestTypeRelease({
        ...mainDnpManifest,
        dependencies: {
          [idDep]: dependencyReleaseHash
        }
      });
    });

    async function cleanArtifacts(): Promise<void> {
      await shell(`docker rm -f ${containerNameMain}`).catch(() => {});
    }

    before("Up mock docker packages", async () => {
      await cleanArtifacts();

      const composePathMain = getPath.dockerCompose(idMain, false);
      validate.path(composePathMain);
      writeComposeObj(composePathMain, composeMain);
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
        avatar:
          "http://dappmanager.dappnode/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt",
        metadata: {
          name: idMain,
          version: "0.1.0",
          dependencies: {
            [idDep]: dependencyReleaseHash
          },
          type: "service"
        },
        setupSchema: {
          [idMain]: {
            type: "object",
            properties: { payoutAddress: { type: "string" } }
          },
          [idDep]: {
            type: "object",
            properties: { dependencyVar: { type: "string" } }
          }
        },
        setupUiSchema: {
          [idMain]: { payoutAddress: { "ui:help": "Special help text" } },
          [idDep]: { dependencyVar: { "ui:help": "Special help text" } }
        },
        imageSize: 636510,
        isUpdated: false,
        isInstalled: true,
        settings: {
          [idMain]: {
            environment: {
              PREVIOUS_SET: "PREV_VAL"
            },
            portMappings: {},
            namedVolumePaths: {}
          },
          [idDep]: {}
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
