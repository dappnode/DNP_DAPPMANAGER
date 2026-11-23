import { expect } from "chai";
import { FullBackupManifest, FullBackupPackageEntry } from "@dappnode/types";
import { inspectBackup, InstalledPackageSummary, planRestore } from "../../../src/fullBackup/plan.js";
import { VALIDATOR_DATA_LEFT_OUT } from "../../../src/fullBackup/coverage.js";

function pkg(dnpName: string, version: string, extra: Partial<FullBackupPackageEntry> = {}): FullBackupPackageEntry {
  return {
    dnpName,
    version,
    isCore: false,
    coverage: "covered",
    namedVolumes: [],
    files: { userSettings: `packages/${dnpName}/user-settings.json` },
    backup: [{ name: "data", path: "/data", file: `packages/${dnpName}/backup/data.tar` }],
    ...extra
  };
}

function manifest(packages: FullBackupPackageEntry[], extra: Partial<FullBackupManifest> = {}): FullBackupManifest {
  return {
    formatVersion: 1,
    createdAt: "2026-11-23T10:00:00.000Z",
    dappmanager: { version: "0.2.95" },
    arch: "x64",
    dappmanagerFiles: { mainDb: "dappmanager/maindb.json", cacheDb: "dappmanager/cachedb.json" },
    packages,
    ...extra
  };
}

const installed = (dnpName: string, version: string, isCore = false): InstalledPackageSummary => ({
  dnpName,
  version,
  isCore
});

function actions(plan: ReturnType<typeof planRestore>): Record<string, string> {
  return Object.fromEntries(plan.packages.map((p) => [p.dnpName, `${p.action}${p.restoreData ? "+data" : ""}`]));
}

describe("fullBackup / plan", () => {
  const backup = manifest([
    pkg("dappmanager.dnp.dappnode.eth", "0.2.95", { isCore: true }),
    pkg("wifi.dnp.dappnode.eth", "0.2.9", { isCore: true }),
    pkg("new.dnp.dappnode.eth", "1.0.0"),
    pkg("same.dnp.dappnode.eth", "1.0.0"),
    pkg("older-here.dnp.dappnode.eth", "2.0.0"),
    pkg("newer-here.dnp.dappnode.eth", "1.0.0"),
    pkg("dev.dnp.dappnode.eth", "1.0.0", { isDev: true, origin: "dev" })
  ]);
  const node = [
    installed("dappmanager.dnp.dappnode.eth", "0.2.95", true),
    installed("bind.dnp.dappnode.eth", "0.2.11", true),
    installed("same.dnp.dappnode.eth", "1.0.0"),
    installed("older-here.dnp.dappnode.eth", "1.5.0"),
    installed("newer-here.dnp.dappnode.eth", "1.2.0"),
    installed("only-here.dnp.dappnode.eth", "3.0.0")
  ];

  it("merge keeps this node's data, system packages and extra packages", () => {
    expect(actions(planRestore({ manifest: backup, installed: node, mode: "merge" }))).to.deep.equal({
      "dappmanager.dnp.dappnode.eth": "skip",
      "wifi.dnp.dappnode.eth": "skip",
      "new.dnp.dappnode.eth": "install+data",
      "same.dnp.dappnode.eth": "apply-settings",
      "older-here.dnp.dappnode.eth": "update",
      "newer-here.dnp.dappnode.eth": "keep-newer",
      "dev.dnp.dappnode.eth": "skip"
    });
  });

  it("clone replaces data, restores system packages and removes extra packages", () => {
    const plan = planRestore({ manifest: backup, installed: node, mode: "clone" });
    expect(actions(plan)).to.deep.equal({
      "dappmanager.dnp.dappnode.eth": "skip",
      "wifi.dnp.dappnode.eth": "install+data",
      "new.dnp.dappnode.eth": "install+data",
      "same.dnp.dappnode.eth": "apply-settings+data",
      "older-here.dnp.dappnode.eth": "update+data",
      "newer-here.dnp.dappnode.eth": "keep-newer",
      "dev.dnp.dappnode.eth": "skip",
      "only-here.dnp.dappnode.eth": "remove"
    });
    expect(plan.packages.some((p) => p.dnpName === "bind.dnp.dappnode.eth")).to.equal(false);
    expect(plan.restoresIdentity && plan.restoresAdminLogin && plan.restoresSystemSettings).to.equal(true);
  });

  it("never restores data over a newer version", () => {
    for (const mode of ["merge", "clone"] as const) {
      const plan = planRestore({ manifest: backup, installed: node, mode });
      const newer = plan.packages.find((p) => p.dnpName === "newer-here.dnp.dappnode.eth");
      expect(newer?.restoreData).to.equal(false);
    }
  });

  it("does not plan data restore when no backup item was captured", () => {
    const failed = manifest([
      pkg("a.dnp.dappnode.eth", "1.0.0", { backup: [{ name: "x", path: "/x", error: "gone" }] })
    ]);
    const plan = planRestore({ manifest: failed, installed: [], mode: "clone" });
    expect(plan.packages[0]).to.include({ action: "install", restoreData: false });
    expect(plan.warnings[0]).to.include("could not be backed up originally");
  });

  it("does not warn about SQLite side files that were absent at backup time", () => {
    const plan = planRestore({
      manifest: manifest([
        pkg("a.dnp.dappnode.eth", "1.0.0", {
          backup: [
            { name: "db", path: "/data/app.db", file: "packages/a.dnp.dappnode.eth/backup/db.tar" },
            { name: "db-wal", path: "/data/app.db-wal", error: "not present (database closed cleanly)" },
            { name: "db-shm", path: "/data/app.db-shm", error: "not present (database closed cleanly)" }
          ]
        }),
        // A side file that failed for another reason is still reported
        pkg("b.dnp.dappnode.eth", "1.0.0", {
          backup: [
            { name: "db", path: "/data/app.db", file: "packages/b.dnp.dappnode.eth/backup/db.tar" },
            { name: "db-wal", path: "/data/app.db-wal", error: "socket hang up" }
          ]
        })
      ]),
      installed: [],
      mode: "clone"
    });
    expect(plan.warnings).to.deep.equal(["b.dnp.dappnode.eth: db-wal could not be backed up originally"]);
    expect(plan.packages[0]).to.include({ action: "install", restoreData: true });
  });

  it("says when a validator's keys were left out on purpose, instead of reporting a failure", () => {
    const plan = planRestore({
      manifest: manifest([
        pkg("web3signer.dnp.dappnode.eth", "1.0.0", {
          backup: [
            { name: "keystores", path: "/data/keyfiles", error: VALIDATOR_DATA_LEFT_OUT },
            { name: "slashing-protection", path: "/data/slashing", error: VALIDATOR_DATA_LEFT_OUT }
          ]
        })
      ]),
      installed: [],
      mode: "clone"
    });
    expect(plan.warnings).to.have.length(1);
    expect(plan.warnings[0]).to.include("left out of this backup").and.include("Import them again");
    expect(plan.packages[0]).to.include({ action: "install", restoreData: false, validator: true });
  });

  it("flags validator packages", () => {
    const plan = planRestore({
      manifest: manifest([
        pkg("web3signer.dnp.dappnode.eth", "1.0.0"),
        pkg("x.dnp.dappnode.eth", "1.0.0", { backup: [{ name: "keystores", path: "/keys", file: "k" }] }),
        pkg("y.dnp.dappnode.eth", "1.0.0")
      ]),
      installed: [],
      mode: "merge"
    });
    expect(plan.packages.map((p) => p.validator)).to.deep.equal([true, true, false]);
  });

  it("blocks backups from a newer dappmanager", () => {
    const result = inspectBackup({
      manifest: manifest([], { dappmanager: { version: "0.3.0" } }),
      installed: [],
      dappmanagerVersion: "0.2.95",
      arch: "x64"
    });
    expect(result.blockers[0]).to.include("newer dappmanager");
    expect(
      inspectBackup({ manifest: manifest([]), installed: [], dappmanagerVersion: "0.2.96", arch: "x64" }).blockers
    ).to.deep.equal([]);
  });

  it("suggests clone on a fresh node and merge on a node with packages", () => {
    const fresh = [installed("dappmanager.dnp.dappnode.eth", "0.2.95", true)];
    expect(
      inspectBackup({ manifest: backup, installed: fresh, dappmanagerVersion: "0.2.95", arch: "x64" }).suggestedMode
    ).to.equal("clone");
    expect(
      inspectBackup({ manifest: backup, installed: node, dappmanagerVersion: "0.2.95", arch: "x64" }).suggestedMode
    ).to.equal("merge");
  });

  it("warns about a different architecture and requires validator confirmation", () => {
    const result = inspectBackup({
      manifest: manifest([pkg("web3signer.dnp.dappnode.eth", "1.0.0")], { arch: "arm64" }),
      installed: [],
      dappmanagerVersion: "0.2.95",
      arch: "x64"
    });
    expect(result.plans.merge.warnings[0]).to.include("arm64");
    expect(result.requiresValidatorConfirmation).to.equal(true);
  });
});
