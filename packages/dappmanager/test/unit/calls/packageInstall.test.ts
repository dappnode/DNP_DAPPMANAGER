import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { PackageRelease } from "@dappnode/common";
import { getMockEventBus } from "./eventBus";
import rewiremock from "rewiremock/webpack";
// Imports for typings
import { packageInstall as packageInstallType } from "../../../src/calls/packageInstall";
import { DappGetState } from "../../../src/modules/dappGet/types";
import { mockManifest, mockRelease } from "../../testUtils";
import { ReleaseFetcher } from "../../../src/modules/release";
import { Manifest } from "@dappnode/dappnodesdk";
import { PackageRequest } from "../../../src/types";

describe.skip("Call function: packageInstall", function () {
  // Pkg data
  const pkgName = "dapp.dnp.dappnode.eth";
  const pkgVer = "0.1.1";
  const pkgManifest: Manifest = {
    ...mockManifest,
    name: pkgName,
    type: "service"
  };
  const pkgPkg: PackageRelease = {
    ...mockRelease,
    metadata: pkgManifest,
    dnpName: pkgName,
    reqVersion: pkgVer
  };

  // Dep data
  const depName = "kovan.dnp.dappnode.eth";
  const depVer = "0.1.1";
  const depManifest: Manifest = {
    ...mockManifest,
    name: depName,
    type: "library"
  };
  const depPkg: PackageRelease = {
    ...mockRelease,
    metadata: depManifest,
    dnpName: depName,
    reqVersion: depVer
  };

  // Stub packages module. Resolve always returning nothing
  const packages = {
    download: sinon.fake.resolves(null),
    load: sinon.fake.resolves(null),
    run: sinon.fake.resolves(null)
  };

  const dappGetSpy = sinon.spy();

  class ReleaseFetcherMock extends ReleaseFetcher {
    async getReleasesResolved(req: PackageRequest): Promise<{
      releases: PackageRelease[];
      message: string;
      state: DappGetState;
      alreadyUpdated: DappGetState;
      currentVersions: DappGetState;
    }> {
      dappGetSpy(req);
      return {
        message: "Found compatible state",
        state: { [pkgName]: pkgVer, [depName]: depVer },
        alreadyUpdated: {},
        currentVersions: {},
        releases: [pkgPkg, depPkg]
      };
    }
  }

  const eventBus = getMockEventBus();

  let packageInstall: typeof packageInstallType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../../src/calls/packageInstall"),
      mock => {
        mock(() => import("../../../src/modules/release"))
          .with({ ReleaseFetcher: ReleaseFetcherMock })
          .toBeUsed();
        mock(() => import("../../../src/eventBus"))
          .with({ eventBus })
          .toBeUsed();
      }
    );
    packageInstall = mock.packageInstall;
  });

  // before(() => {
  //     const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
  //     validate.path(DOCKERCOMPOSE_PATH);
  //     fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeTemplate);
  // });

  it("should install the package with correct arguments", async () => {
    const res = await packageInstall({ name: pkgName });
    expect(res).to.be.an("object");
    expect(res).to.have.property("message");
  });

  // Step 1: Parse request
  // Step 2: Resolve the request
  it("should have called dappGet with correct arguments", async () => {
    sinon.assert.calledWith(dappGetSpy, {
      name: pkgName,
      req: pkgName,
      ver: "*"
    });
  });

  const callKwargPkg = {
    id: pkgName,
    pkg: {
      ...pkgPkg,
      imageData: {
        environment: [],
        ports: [],
        volumes: []
      },
      isCore: false
    }
  };
  const callKwargDep = {
    id: pkgName,
    pkg: {
      ...depPkg,
      imageData: {
        environment: [],
        ports: [],
        volumes: []
      },
      isCore: false
    }
  };

  // Step 3: Format the request and filter out already updated packages
  // Step 4: Download requested packages
  it("should have called download", async () => {
    sinon.assert.callCount(packages.download, 2);
    expect([
      packages.download.getCall(0).args[0],
      packages.download.getCall(1).args[0]
    ]).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.download for ${pkgName} and ${depName}`
    );
  });

  it("should have called load", async () => {
    sinon.assert.callCount(packages.load, 2);

    expect([
      packages.load.getCall(0).args[0],
      packages.load.getCall(1).args[0]
    ]).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.load for ${pkgName} and ${depName}`
    );
  });

  // Step 5: Run requested packages
  it("should have called run", async () => {
    sinon.assert.callCount(packages.run, 2);

    expect([
      packages.run.getCall(0).args[0],
      packages.run.getCall(1).args[0]
    ]).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.run for ${pkgName} and ${depName}`
    );
  });

  // Step FINAL:
  it("should request to emit packages to refresh the UI", async () => {
    sinon.assert.calledOnce(eventBus.runNatRenewal.emit);
    sinon.assert.calledOnce(eventBus.requestPackages.emit);
  });
});
