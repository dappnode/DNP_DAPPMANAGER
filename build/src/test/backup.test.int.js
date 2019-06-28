const expect = require("chai").expect;
const shell = require("utils/shell");
const path = require("path");
const dataUriToFile = require("utils/dataUriToFile");
const { testDir, cleanTestDir, createTestDir } = require("./testUtils");

// Calls
const backupGet = require("calls/backupGet");
const backupRestore = require("calls/backupRestore");

// MUST use function for this.timeout to work <====== function() ???
describe("Integration test for backup to and from: ", function() {
  // Generic paths
  const dir = "test";
  const subDirName = "sub-test";
  const fileName = "data.conf";
  const content = "Amazing test content";
  const subDir = path.join(dir, subDirName);
  const file = path.join(subDir, fileName);
  // Paths on the host
  const onServerDir = path.join(testDir, dir);
  const onServerSubDir = path.join(testDir, subDir);
  const onServerFile = path.join(testDir, file);
  // Paths on the container
  const containerRoot = "/";
  const onContainerDir = path.join(containerRoot, dir);
  const onContainerFile = path.join(containerRoot, file);

  /**
   * /etc/nginx/nginx.conf - single file 646 Bytes
   * /etc/nginx/conf.d - directory 8 KB
   */
  const id = "test-backup.dnp.dappnode.eth";
  const containerName = `DAppNodePackage-${id}`;

  const backupNameFile = "config";
  const backupNameDir = "testDir";
  const backup = [
    { name: backupNameFile, path: onContainerFile },
    { name: backupNameDir, path: onContainerDir }
  ];

  const dataUri =
    "data:application/zip;base64,UEsDBAoAAAAAAIa1204AAAAAAAAAAAAAAAAIABwAdGVzdERpci9VVAkAA5sqFV2dKhVddXgLAAEE6AMAAAToAwAAUEsDBAoAAAAAAIa1204AAAAAAAAAAAAAAAARABwAdGVzdERpci9zdWItdGVzdC9VVAkAA5sqFV2dKhVddXgLAAEE6AMAAAToAwAAUEsDBAoAAAAAAIa1204WtQzjFQAAABUAAAAaABwAdGVzdERpci9zdWItdGVzdC9kYXRhLmNvbmZVVAkAA5sqFV2bKhVddXgLAAEE6AMAAAToAwAAQW1hemluZyB0ZXN0IGNvbnRlbnQKUEsDBAoAAAAAAIa1204WtQzjFQAAABUAAAAGABwAY29uZmlnVVQJAAObKhVdmyoVXXV4CwABBOgDAAAE6AMAAEFtYXppbmcgdGVzdCBjb250ZW50ClBLAQIeAwoAAAAAAIa1204AAAAAAAAAAAAAAAAIABgAAAAAAAAAEADtQQAAAAB0ZXN0RGlyL1VUBQADmyoVXXV4CwABBOgDAAAE6AMAAFBLAQIeAwoAAAAAAIa1204AAAAAAAAAAAAAAAARABgAAAAAAAAAEADtQUIAAAB0ZXN0RGlyL3N1Yi10ZXN0L1VUBQADmyoVXXV4CwABBOgDAAAE6AMAAFBLAQIeAwoAAAAAAIa1204WtQzjFQAAABUAAAAaABgAAAAAAAEAAACkgY0AAAB0ZXN0RGlyL3N1Yi10ZXN0L2RhdGEuY29uZlVUBQADmyoVXXV4CwABBOgDAAAE6AMAAFBLAQIeAwoAAAAAAIa1204WtQzjFQAAABUAAAAGABgAAAAAAAEAAACkgfYAAABjb25maWdVVAUAA5sqFV11eAsAAQToAwAABOgDAABQSwUGAAAAAAQABABRAQAASwEAAAAA";

  const negativeTestFolder = "TESTESTESTEST";
  /**
   * zip file contains metadata, such as file creation times
   * so the resulting base64 is not deterministic
   */

  async function run(cmd) {
    return await shell(`docker exec ${containerName} ${cmd}`);
  }

  beforeEach("Up a test docker container", async () => {
    this.timeout(60000);
    await createTestDir();

    // Create container
    await shell(`docker rm -f ${containerName}`).catch(() => {});
    await shell(`docker run -d --name ${containerName} nginx:alpine`);

    // Populate the container with shit data
    await shell(`mkdir -p ${onServerSubDir}`);
    await shell(`echo "${content}" > ${onServerFile}`);
    await shell(`docker cp ${onServerDir} ${containerName}:test`);
  });

  it("Should get a backup for nginx", async () => {
    // Test to make sure the container is recreated
    await run(`mkdir ${negativeTestFolder}`);
    expect(await run("ls -ltr")).to.include(
      negativeTestFolder,
      "negative test folder NOT found. This helps ensure that the container is recreated"
    );

    // Actual call
    const res = await backupGet({ id, backup });

    expect(res).to.be.ok;
    expect(res.message).to.equal(
      "Backup test-backup.dnp.dappnode.eth, items: config, testDir"
    );
    expect(res.result).to.be.a("string");
    expect(res.result).to.include("data:application/zip;base64,");
    /**
     * [NOTE] validate the returned base64, assuming it's not deterministic
     *
     */
    await createTestDir();
    const validateDir = path.join(testDir, "validateFiles");
    const validateDirComp = `${validateDir}.zip`;
    dataUriToFile(dataUri, validateDirComp);
    await shell(`unzip ${validateDirComp} -d ${validateDir}`);
    // Check the file contents
    const backupFileContent = await shell(
      `cat ${path.join(validateDir, backupNameFile)}`
    );
    expect(backupFileContent).to.equal(
      content,
      `Backup file (name ${backupNameFile}) contents are incorrect`
    );
    // Check the dir contents
    const backupSubDirContent = await shell(
      `cat ${path.join(validateDir, backupNameDir, subDirName, fileName)}`
    );
    expect(backupSubDirContent).to.equal(
      content,
      `Backup sub dir file (name ${backupNameDir}) contents are incorrect`
    );
  }).timeout(60 * 1000);

  it("Should restore a backup for nginx", async () => {
    // Test to make sure the container is recreated
    expect(await run("ls -ltr")).to.not.include(
      negativeTestFolder,
      "negative test folder FOUND (should not). This helps ensure that the container is recreated"
    );
    await run("ls -ltr");

    // Actual call
    const res = await backupRestore({ id, dataUri, backup });

    expect(res).to.be.ok;
    expect(res.message).to.equal(
      "Restored backup test-backup.dnp.dappnode.eth, items: config, testDir"
    );
    /**
     * Validate that the files are correctly added
     */
    expect(await run(`ls ${onContainerDir}`)).to.include(subDirName);
    expect(await run(`cat ${onContainerFile}`)).to.include(content);
  }).timeout(60 * 1000);

  after("Clean test docker container", async () => {
    this.timeout(60000);
    await cleanTestDir();
    await shell(`docker rm -f ${containerName}`);
  });
});
