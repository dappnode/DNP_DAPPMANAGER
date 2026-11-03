import "mocha";
import { expect } from "chai";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL("../../hostScripts/", import.meta.url));

describe("host security scripts", () => {
  let temporary: string;
  beforeEach(() => {
    temporary = fs.mkdtempSync(path.join(os.tmpdir(), "dappnode-host-security-"));
  });
  afterEach(() => fs.rmSync(temporary, { recursive: true, force: true }));

  function update(failure?: "update" | "upgrade") {
    const apt = path.join(temporary, "apt-get");
    const log = path.join(temporary, "calls");
    fs.writeFileSync(
      apt,
      '#!/bin/bash\nprintf "%s\\n" "$*" >> "$APT_TEST_LOG"\nfor argument in "$@"; do if [[ "$argument" == "${APT_TEST_FAIL:-}" ]]; then exit 42; fi; done\n'
    );
    fs.chmodSync(apt, 0o755);
    const result = spawnSync("bash", [path.join(scriptDir, "update_upgrade.sh")], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${temporary}:${process.env.PATH}`, APT_TEST_LOG: log, APT_TEST_FAIL: failure }
    });
    return { result, calls: fs.readFileSync(log, "utf8") };
  }

  it("stops on a package-index failure without showing success", () => {
    const { result, calls } = update("update");
    expect(result.status).to.equal(42);
    expect(result.stdout).not.to.contain("were successful");
    expect(calls).not.to.contain(" upgrade");
  });

  it("propagates installation failures", () => {
    const { result } = update("upgrade");
    expect(result.status).to.equal(42);
    expect(result.stdout).not.to.contain("were successful");
  });

  it("allows new kernel dependencies and preserves recovery kernels", () => {
    const { result, calls } = update();
    expect(result.status).to.equal(0);
    expect(calls).to.contain("--with-new-pkgs upgrade");
    expect(calls).not.to.contain("autoremove");
    expect(calls).not.to.contain("proposed");
  });

  function rebootStatus(marker?: string, checker?: string, reboot = false) {
    const root = `${temporary}/host`;
    fs.mkdirSync(`${root}/run`, { recursive: true });
    fs.mkdirSync(`${root}/security`, { recursive: true });
    if (marker) fs.writeFileSync(`${root}/security/cve-2026-98432.status`, marker);
    if (checker) fs.writeFileSync(`${root}/mitigate.sh`, checker);
    if (reboot) fs.writeFileSync(`${root}/run/reboot-required`, "");
    const script = fs
      .readFileSync(path.join(scriptDir, "reboot_required.sh"), "utf8")
      .replaceAll("/var/run/", `${root}/run/`)
      .replace("/usr/src/dappnode/DNCORE/security", `${root}/security`)
      .replace("/usr/local/lib/dappnode/mitigate_cve_2026_98432.sh", `${root}/mitigate.sh`);
    const relocated = path.join(temporary, "reboot_required.sh");
    fs.writeFileSync(relocated, script);
    return JSON.parse(execFileSync("bash", [relocated], { encoding: "utf8" }));
  }

  it("supports older hosts without a mitigation marker", () => {
    expect(rebootStatus()).to.deep.equal({ rebootRequired: false, pkgs: "" });
  });

  it("does not trust an old mitigated marker when the live check fails", () => {
    expect(rebootStatus("mitigated", "exit 1\n").kernelSecurityMitigation).to.equal("failed");
    expect(rebootStatus("mitigated").kernelSecurityMitigation).to.equal("failed");
  });

  it("keeps mitigation status separate from an unrelated pending reboot", () => {
    const result = rebootStatus("mitigated", "echo mitigated\n", true);
    expect(result).to.deep.equal({ rebootRequired: true, pkgs: "", kernelSecurityMitigation: "mitigated" });
  });

  it("rejects unexpected checker output", () => {
    expect(rebootStatus("mitigated", 'echo "invalid-status"\n').kernelSecurityMitigation).to.equal("failed");
  });
});
