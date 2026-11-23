import "mocha";
import { expect } from "chai";
import { DappnodeInstaller, ErrorDappGetDowngrade, DappgetOptions } from "@dappnode/installer";
import { PackageRelease, PackageRequest } from "@dappnode/types";
import { resolveCoreReleases } from "../../src/autoUpdates/getCoreUpdateData.js";

const coreName = "core.dnp.dappnode.eth";

function mockRelease(dnpName: string, version: string): PackageRelease {
  return { dnpName, manifest: { name: dnpName, version } } as unknown as PackageRelease;
}

interface ResolveCall {
  req: PackageRequest;
  options?: DappgetOptions;
}

function mockInstaller({
  fullResolver,
  basicResolver,
  latestCoreVersion = "0.3.28"
}: {
  fullResolver: () => PackageRelease[];
  basicResolver?: (req: PackageRequest) => PackageRelease[];
  latestCoreVersion?: string;
}): { installer: DappnodeInstaller; calls: ResolveCall[] } {
  const calls: ResolveCall[] = [];
  const installer = {
    async getReleasesResolved(req: PackageRequest, options?: DappgetOptions) {
      calls.push({ req, options });
      const releases = options?.BYPASS_RESOLVER ? (basicResolver ?? (() => []))(req) : fullResolver();
      return { releases, message: "", state: {}, alreadyUpdated: {}, currentVersions: {} };
    },
    async getVersionAndIpfsHash({ version }: { dnpNameOrHash: string; version?: string }) {
      return { version: version === "*" ? latestCoreVersion : version, contentUri: "/ipfs/Qm" };
    }
  } as unknown as DappnodeInstaller;
  return { installer, calls };
}

describe("daemons > autoUpdates > resolveCoreReleases", () => {
  it("returns the full resolver releases when there is no conflict", async () => {
    const releases = [mockRelease(coreName, "0.3.28")];
    const { installer, calls } = mockInstaller({ fullResolver: () => releases });

    expect(await resolveCoreReleases(installer, "*")).to.deep.equal(releases);
    expect(calls).to.have.length(1);
  });

  it("still reports the core package when a dependency was updated ahead of core", async () => {
    // core@0.3.28 pins dappmanager@0.2.129 but dappmanager@0.2.130 is installed
    const { installer, calls } = mockInstaller({
      fullResolver: () => {
        throw new ErrorDappGetDowngrade({ dnpName: "dappmanager.dnp.dappnode.eth", dnpVersion: "0.2.130" });
      },
      basicResolver: (req) => [mockRelease(coreName, req.ver)]
    });

    const releases = await resolveCoreReleases(installer, "*");

    expect(releases.map((r) => `${r.dnpName}@${r.manifest.version}`)).to.deep.equal([`${coreName}@0.3.28`]);
    expect(calls[1]).to.deep.equal({
      req: { name: coreName, ver: "0.3.28" },
      options: { BYPASS_RESOLVER: true }
    });
  });

  it("returns no releases when core itself is up to date despite the conflict", async () => {
    const { installer } = mockInstaller({
      fullResolver: () => {
        throw new ErrorDappGetDowngrade({ dnpName: "dappmanager.dnp.dappnode.eth", dnpVersion: "0.2.130" });
      },
      basicResolver: () => []
    });

    expect(await resolveCoreReleases(installer, "*")).to.deep.equal([]);
  });

  it("rethrows other resolver errors", async () => {
    const { installer } = mockInstaller({
      fullResolver: () => {
        throw new Error("IPFS timeout");
      }
    });

    let error: Error | undefined;
    try {
      await resolveCoreReleases(installer, "*");
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message).to.equal("IPFS timeout");
  });
});
