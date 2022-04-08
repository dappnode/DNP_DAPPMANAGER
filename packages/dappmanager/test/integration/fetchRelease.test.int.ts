import "mocha";
import { expect } from "chai";
import { omit } from "lodash";
import * as calls from "../../src/calls";
import { RequestedDnp, Manifest, SetupWizard } from "../../src/types";
import {
  clearDbs,
  createTestDir,
  cleanRepos,
  cleanContainers,
  shellSafe
} from "../testUtils";
import { uploadDirectoryRelease } from "../integrationSpecs";
import * as validate from "../../src/utils/validate";
import { dockerComposeUp } from "../../src/modules/docker/compose";
import { ComposeEditor } from "../../src/modules/compose/editor";
import { getContainerName, getImageTag } from "../../src/params";

describe("Fetch releases", () => {
  // This mountpoints have files inside created by docker with the root
  // user group, so they can't be cleaned by other tests.
  // #### TODO: While a better solution is found, each test will use a separate dir

  const dnpNameMain = "main.dnp.dappnode.eth";
  const dnpNameDep = "dependency.dnp.dappnode.eth";
  const dnpNames = [dnpNameMain, dnpNameDep];
  const mainVersion = "0.1.0";

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

  describe("fetchDnpRequest with misc files (directory release)", () => {
    const mainDnpManifest: Manifest = {
      name: dnpNameMain,
      version: mainVersion,
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
        isVerified: false,
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
