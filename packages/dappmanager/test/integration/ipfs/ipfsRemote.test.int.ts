import "mocha";
import { expect } from "chai";
// IPFS
import { ipfsGateway } from "../../../src/modules/ipfs/remote";
import { IpfsContentFromGateway } from "../../../src/modules/ipfs/remote/IpfsGateway";
// Utils
import { absoluteTestDir } from "../../testUtils";
import shell from "../../../src/utils/shell";
import params from "../../../src/params";
// Node
import path from "path";
import fs from "fs";
import { getPackageFromIpfsGateway } from "../../../src/modules/ipfs/remote/car";

describe.only("IPFS remote", function () {
  // DAppNode Package path
  const packagePath = path.join(absoluteTestDir, "rotki.dnp.dappnode.eth");
  // Rotki v0.1.2 dir hash
  const v0CidDir = "QmUn3rbJmLinK518kLwvHfcVbefnLfwe4AYQz88KkaTZZp";

  before(async () => {
    await shell(`mkdir -p ${packagePath}`);
    params.REPO_DIR = packagePath;
  });

  it.only("whatever", async function () {
    this.timeout(100000 * 5);
    const content = await getPackageFromIpfsGateway(v0CidDir);
    console.log(content);
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

    const cid = await ipfsGateway.resolveCid(v0CidDir);
    const carReader = await ipfsGateway.getCarReader(cid);
    const carReaderRoots = await ipfsGateway.getCarReaderRoots(carReader);
    const carReaderBlock = await ipfsGateway.getCarReaderBlock(
      carReader,
      carReaderRoots
    );

    const packageContent = new IpfsContentFromGateway(
      cid,
      carReader,
      carReaderRoots,
      carReaderBlock
    );

    if (!packageContent.isVerified)
      throw Error("CIDs are not equal, untrusted content!");

    // Write content to testDir
    await packageContent.writeFiles();
    const packageFiles = fs.readdirSync(params.REPO_DIR);
    expect(packageFiles).to.deep.equal(expectedPackageFiles);
  });

  after(async () => {
    await shell(`rm -rf ${packagePath}`);
    params.REPO_DIR = "./dnp_repo";
  });
});
