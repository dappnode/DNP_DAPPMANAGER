import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import {
  InstallerPkg,
  ProgressLog,
  PackageRequest,
  PortMapping,
  Manifest,
  PackageRelease
} from "../../src/types";
import rewiremock from "rewiremock";
// Imports for typings
import installPackageType from "../../src/calls/installPackage";
import { DappGetResult } from "../../src/modules/dappGet/types";
import { mockManifest, mockRelease } from "../testUtils";

describe.skip("Call function: installPackage", function() {
  // Pkg data
  const pkgName = "dapp.dnp.dappnode.eth";
  const pkgVer = "0.1.1";
  const pkgManifest: Manifest = {
    ...mockManifest,
    name: pkgName,
    type: "service"
  };
  const pkgPkg = {
    ...mockRelease,
    manifest: pkgManifest,
    name: pkgName,
    version: pkgVer
  };

  // Dep data
  const depName = "kovan.dnp.dappnode.eth";
  const depVer = "0.1.1";
  const depManifest: Manifest = {
    ...mockManifest,
    name: depName,
    type: "library"
  };
  const depPortsToOpen: PortMapping[] = [
    { host: 32769, container: 32769, protocol: "UDP" },
    { host: 32769, container: 32769, protocol: "TCP" }
  ];
  const depPkg = {
    ...mockRelease,
    manifest: depManifest,
    name: depName,
    version: depVer
  };

  // Stub packages module. Resolve always returning nothing
  const packages = {
    download: sinon.fake.resolves(null),
    load: sinon.fake.resolves(null),
    run: sinon.fake.resolves(null)
  };

  const dappGetSpy = sinon.spy();
  async function dappGet(req: PackageRequest): Promise<DappGetResult> {
    dappGetSpy(req);
    return {
      message: "Found compatible state",
      state: { [pkgName]: pkgVer, [depName]: depVer },
      alreadyUpdated: {}
    };
  }

  async function getRelease(name: string): Promise<PackageRelease> {
    if (name === pkgName) return pkgPkg;
    else if (name === depName) return depPkg;
    else throw Error(`TEST-MOCK-ERROR Manifest of ${name} not available`);
  }

  const eventBus = {
    runNatRenewal: { emit: sinon.stub(), on: sinon.stub() },
    requestPackages: { emit: sinon.stub(), on: sinon.stub() },
    packageModified: { emit: sinon.stub(), on: sinon.stub() }
  };

  // Simulate that only the dependency has p2p ports
  const lockPortsSpy = sinon.spy();
  async function lockPorts(id: string): Promise<PortMapping[]> {
    lockPortsSpy(id);
    if (id === depName) return depPortsToOpen;
    else return [];
  }

  function logUi(progressLog: ProgressLog): void {
    progressLog;
  }

  // Simulated the chain is already synced
  const isSyncing = async (): Promise<boolean> => false;

  let installPackage: typeof installPackageType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../src/calls/installPackage"),
      mock => {
        mock(() => import("../../src/modules/dappGet"))
          .withDefault(dappGet)
          .toBeUsed();
        mock(() => import("../../src/modules/lockPorts"))
          .withDefault(lockPorts)
          .toBeUsed();
        mock(() => import("../../src/modules/release/getRelease"))
          .withDefault(getRelease)
          .toBeUsed();
        mock(() => import("../../src/utils/isSyncing"))
          .withDefault(isSyncing)
          .toBeUsed();
        mock(() => import("../../src/utils/logUi"))
          .with({ logUi })
          .toBeUsed();
        mock(() => import("../../src/eventBus"))
          .with(eventBus)
          .toBeUsed();
      }
    );
    installPackage = mock.default;
  });

  // before(() => {
  //     const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
  //     validate.path(DOCKERCOMPOSE_PATH);
  //     fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeTemplate);
  // });

  it("should install the package with correct arguments", async () => {
    const res = await installPackage({ id: pkgName });
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

  interface SortablePkg {
    pkg: InstallerPkg;
  }
  function sortById(a: SortablePkg, b: SortablePkg): number {
    return a.pkg.name > b.pkg.name ? 1 : a.pkg.name < b.pkg.name ? -1 : 0;
  }

  // Step 3: Format the request and filter out already updated packages
  // Step 4: Download requested packages
  it("should have called download", async () => {
    sinon.assert.callCount(packages.download, 2);
    expect(
      [
        packages.download.getCall(0).args[0],
        packages.download.getCall(1).args[0]
      ].sort(sortById)
    ).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.download for ${pkgName} and ${depName}`
    );
  });

  it("should have called load", async () => {
    sinon.assert.callCount(packages.load, 2);

    expect(
      [packages.load.getCall(0).args[0], packages.load.getCall(1).args[0]].sort(
        sortById
      )
    ).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.load for ${pkgName} and ${depName}`
    );
  });

  // Step 5: Run requested packages
  it("should have called run", async () => {
    sinon.assert.callCount(packages.run, 2);

    expect(
      [packages.run.getCall(0).args[0], packages.run.getCall(1).args[0]].sort(
        sortById
      )
    ).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.run for ${pkgName} and ${depName}`
    );
  });

  // Step 6: P2P ports: modify docker-compose + open ports
  it("should call lockPorts", async () => {
    sinon.assert.callCount(lockPortsSpy, 2);
    expect(lockPortsSpy.firstCall.lastArg).to.equal(pkgName, "Wrong 1st call");
    expect(lockPortsSpy.secondCall.lastArg).to.equal(depName, "Wrong 2nd call");
  });

  // Step FINAL:
  it("should request to emit packages to refresh the UI", async () => {
    sinon.assert.calledOnce(eventBus.runNatRenewal.emit);
    sinon.assert.calledOnce(eventBus.requestPackages.emit);
    sinon.assert.calledOnce(eventBus.packageModified.emit);
    expect(eventBus.packageModified.emit.lastCall.lastArg).to.deep.equal({
      id: pkgName
    });
  });
});
