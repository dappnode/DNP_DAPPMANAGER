import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { params } from "@dappnode/params";
import { getDockerComposePath, getManifestPath, getEnvFilePath, getRepoDirPath } from "@dappnode/utils";
import { removePackageFiles } from "../../../src/calls/packageRemove.js";

describe("Call function: packageRemove > removePackageFiles", () => {
  const proofsDnpName = "nexus-proofs.dnp.dappnode.eth";
  const proofsFiles = [
    getDockerComposePath(proofsDnpName, true),
    getManifestPath(proofsDnpName, true),
    getEnvFilePath(proofsDnpName, true)
  ];
  const bindCompose = getDockerComposePath(params.bindDnpName, true);
  const regularDnpName = "regular.dnp.dappnode.eth";
  const regularRepoDir = getRepoDirPath(regularDnpName, false);

  beforeEach(() => {
    fs.mkdirSync(params.DNCORE_DIR, { recursive: true });
    for (const filePath of [...proofsFiles, bindCompose]) fs.writeFileSync(filePath, "content");
    fs.mkdirSync(regularRepoDir, { recursive: true });
    fs.writeFileSync(path.join(regularRepoDir, "docker-compose.yml"), "content");
  });

  afterEach(() => {
    for (const filePath of [...proofsFiles, bindCompose]) if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    fs.rmSync(regularRepoDir, { recursive: true, force: true });
  });

  it("removes a core package's own files from DNCORE_DIR", async () => {
    await removePackageFiles(proofsDnpName, true);

    for (const filePath of proofsFiles) expect(fs.existsSync(filePath), path.basename(filePath)).to.equal(false);
  });

  it("leaves other core packages' files and DNCORE_DIR itself in place", async () => {
    await removePackageFiles(proofsDnpName, true);

    expect(fs.existsSync(bindCompose), "bind compose file").to.equal(true);
    expect(fs.existsSync(params.DNCORE_DIR), "DNCORE_DIR").to.equal(true);
  });

  it("removes a regular package's whole repo directory", async () => {
    await removePackageFiles(regularDnpName, false);

    expect(fs.existsSync(regularRepoDir)).to.equal(false);
    expect(fs.existsSync(bindCompose), "core files are untouched").to.equal(true);
  });
});
