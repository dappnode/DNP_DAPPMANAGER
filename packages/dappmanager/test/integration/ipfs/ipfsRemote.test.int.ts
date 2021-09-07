import "mocha";
import { expect } from "chai";
// Utils
import { absoluteTestDir } from "../../testUtils";
import shell from "../../../src/utils/shell";
// Node
import path from "path";
import { ipfsGateway } from "../../../src/modules/ipfs/remote";
import fs from "fs";
import params from "../../../src/params";

describe.only("IPFS remote", function () {
  // DAppNode Package path
  const packagePath = path.join(absoluteTestDir, "rotki.dnp.dappnode.eth");
  // Rotki v0.1.2 dir hash
  const v0CidDir = "QmUn3rbJmLinK518kLwvHfcVbefnLfwe4AYQz88KkaTZZp";

  before(async () => {
    await shell(`mkdir -p ${packagePath}`);
    params.REPO_DIR = packagePath;
  });

  it("Should verify CID and write package to disk from IPFS gateway", async function () {
    this.timeout(100000 * 5);
    const expectedPackageFiles = [
      "avatar.png",
      "dappnode_package.json",
      "docker-compose.yml",
      "getting-started.md",
      "rotki.dnp.dappnode.eth_0.1.2.tar.xz",
      "rotki.dnp.dappnode.eth_0.1.2_linux-amd64.txz"
    ];
    await ipfsGateway.writePackageContentIfCidVerified(v0CidDir);
    const packageFiles = fs.readdirSync(params.REPO_DIR);
    expect(packageFiles).to.deep.equal(expectedPackageFiles);
  });

  after(async () => {
    await shell(`rm -rf ${packagePath}`);
    params.REPO_DIR = "./dnp_repo";
  });
});
