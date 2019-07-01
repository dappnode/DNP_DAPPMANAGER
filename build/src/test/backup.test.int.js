const expect = require("chai").expect;
const shell = require("utils/shell");
const path = require("path");
const db = require("db");
const { testDir, cleanTestDir, createTestDir } = require("./testUtils");

// Calls
const backupGet = require("calls/backupGet");
const backupRestore = require("calls/backupRestore");

// MUST use function for this.timeout to work <====== function() ???
describe("Integration test for backup to and from:", function() {
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
  const onContainerSubDir = path.join(containerRoot, subDir);
  const onContainerFile = path.join(containerRoot, file);

  const validateDir = path.join(testDir, "validateFiles");

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

  const filePath =
    "DNCORE/.temp-transfer/test-backup.dnp.dappnode.eth_backup.zip";

  const dataUri =
    "data:application/zip;base64,UEsDBAoAAAAAAIa1204AAAAAAAAAAAAAAAAIABwAdGVzdERpci9VVAkAA5sqFV2dKhVddXgLAAEE6AMAAAToAwAAUEsDBAoAAAAAAIa1204AAAAAAAAAAAAAAAARABwAdGVzdERpci9zdWItdGVzdC9VVAkAA5sqFV2dKhVddXgLAAEE6AMAAAToAwAAUEsDBAoAAAAAAIa1204WtQzjFQAAABUAAAAaABwAdGVzdERpci9zdWItdGVzdC9kYXRhLmNvbmZVVAkAA5sqFV2bKhVddXgLAAEE6AMAAAToAwAAQW1hemluZyB0ZXN0IGNvbnRlbnQKUEsDBAoAAAAAAIa1204WtQzjFQAAABUAAAAGABwAY29uZmlnVVQJAAObKhVdmyoVXXV4CwABBOgDAAAE6AMAAEFtYXppbmcgdGVzdCBjb250ZW50ClBLAQIeAwoAAAAAAIa1204AAAAAAAAAAAAAAAAIABgAAAAAAAAAEADtQQAAAAB0ZXN0RGlyL1VUBQADmyoVXXV4CwABBOgDAAAE6AMAAFBLAQIeAwoAAAAAAIa1204AAAAAAAAAAAAAAAARABgAAAAAAAAAEADtQUIAAAB0ZXN0RGlyL3N1Yi10ZXN0L1VUBQADmyoVXXV4CwABBOgDAAAE6AMAAFBLAQIeAwoAAAAAAIa1204WtQzjFQAAABUAAAAaABgAAAAAAAEAAACkgY0AAAB0ZXN0RGlyL3N1Yi10ZXN0L2RhdGEuY29uZlVUBQADmyoVXXV4CwABBOgDAAAE6AMAAFBLAQIeAwoAAAAAAIa1204WtQzjFQAAABUAAAAGABgAAAAAAAEAAACkgfYAAABjb25maWdVVAUAA5sqFV11eAsAAQToAwAABOgDAABQSwUGAAAAAAQABABRAQAASwEAAAAA";
  const dataUriPartial =
    "data:application/zip;base64,UEsDBAoAAAAAAKyE3E4AAAAAAAAAAAAAAAAIABwAdGVzdERpci9VVAkAAyQmFl0lJhZddXgLAAEE6AMAAAToAwAAUEsDBAoAAAAAAKyE3E4AAAAAAAAAAAAAAAARABwAdGVzdERpci9zdWItdGVzdC9VVAkAAyQmFl0lJhZddXgLAAEE6AMAAAToAwAAUEsBAh4DCgAAAAAArITcTgAAAAAAAAAAAAAAAAgAGAAAAAAAAAAQAO1BAAAAAHRlc3REaXIvVVQFAAMkJhZddXgLAAEE6AMAAAToAwAAUEsBAh4DCgAAAAAArITcTgAAAAAAAAAAAAAAABEAGAAAAAAAAAAQAO1BQgAAAHRlc3REaXIvc3ViLXRlc3QvVVQFAAMkJhZddXgLAAEE6AMAAAToAwAAUEsFBgAAAAACAAIApQAAAI0AAAAAAA==";
  const dataUriEmpty =
    "data:application/zip;base64,UEsDBAoAAAAAAAGG3E4AAAAAAAAAAAAAAAAGABwAZW1wdHkvVVQJAAOiKBZdoigWXXV4CwABBOgDAAAE6AMAAFBLAQIeAwoAAAAAAAGG3E4AAAAAAAAAAAAAAAAGABgAAAAAAAAAEADtQQAAAABlbXB0eS9VVAUAA6IoFl11eAsAAQToAwAABOgDAABQSwUGAAAAAAEAAQBMAAAAQAAAAAAA";
  /**
   * zip file contains metadata, such as file creation times
   * so the resulting base64 is not deterministic
   */

  async function run(cmd) {
    return await shell(`docker exec ${containerName} ${cmd}`);
  }

  beforeEach("Up a test docker container", async function() {
    this.timeout(60 * 1000);
    await createTestDir();
    await shell(`rm -rf ${validateDir}`);
    // Create container
    await shell(`docker rm -f ${containerName}`).catch(() => {});
    await shell(`docker run -d --name ${containerName} nginx:alpine`);
  });

  it("Should get a backup for nginx", async () => {
    // Populate the container with shit data
    await shell(`mkdir -p ${onServerSubDir}`);
    await shell(`echo "${content}" > ${onServerFile}`);
    await shell(`docker cp ${onServerDir} ${containerName}:${dir}`);

    // Actual call
    const res = await backupGet({ id, backup });

    expect(res).to.be.ok;
    expect(res.message).to.equal(
      "Backup test-backup.dnp.dappnode.eth, items: config, testDir"
    );
    expect(res.result).to.be.a("string");
    // res.result = "e08dbd0f654c0ae06c08570e731c8f14c079ec54ab7e58915d52290612b0a908"
    expect(await db.get(res.result)).to.equal(filePath);

    /**
     * [NOTE] validate the generated file, assuming it's not deterministic
     *
     */
    await createTestDir();
    await shell(`unzip ${filePath} -d ${validateDir}`);
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
    const res = await backupRestore({ id, dataUri, backup });

    expect(res).to.be.ok;
    expect(res.message).to.equal(
      "Restored backup test-backup.dnp.dappnode.eth, items: config, testDir"
    );
    /**
     * Validate that the files are correctly added
     */
    expect(await run(`ls ${onContainerDir}`)).to.equal(
      subDirName,
      `${onContainerDir} in container dir should only contain ${subDirName}`
    );
    expect(await run(`cat ${onContainerFile}`)).to.equal(
      content,
      `Wrong contents of in container file ${onContainerFile}`
    );
  }).timeout(60 * 1000);

  /**
   * Partial backup case
   */

  it("Should get a PARTIAL backup for nginx", async () => {
    // Populate the container with shit data
    await shell(`mkdir -p ${onServerSubDir}`);
    await shell(`docker cp ${onServerDir} ${containerName}:${dir}`);

    // Actual call
    const res = await backupGet({ id, backup });

    expect(res).to.be.ok;
    expect(res.message).to.equal(
      "Backup test-backup.dnp.dappnode.eth, items: testDir"
    );
    expect(res.result).to.be.a("string");
    expect(res.result).to.be.a("string");
    // res.result = "e08dbd0f654c0ae06c08570e731c8f14c079ec54ab7e58915d52290612b0a908"
    expect(await db.get(res.result)).to.equal(filePath);

    /**
     * [NOTE] validate the generated file, assuming it's not deterministic
     *
     */
    await createTestDir();
    await shell(`unzip ${filePath} -d ${validateDir}`);

    // Check the file contents
    const backupDirLs = await shell(`ls ${validateDir}`);
    const backupSubDirLs = await shell(
      `ls ${path.join(validateDir, backupNameDir)}`
    );

    // Check the dir contents
    expect(backupDirLs).to.equal(
      backupNameDir,
      `Backup sub dir file (name ${backupNameDir}) contents are incorrect`
    );
    expect(backupSubDirLs).to.equal(
      subDirName,
      `Backup sub dir file (name ${backupNameDir}) contents are incorrect`
    );
  }).timeout(60 * 1000);

  it("Should restore a PARTIAL backup for nginx", async () => {
    const res = await backupRestore({ id, dataUri: dataUriPartial, backup });

    expect(res).to.be.ok;
    expect(res.message).to.equal(
      "Restored backup test-backup.dnp.dappnode.eth, items: testDir"
    );
    /**
     * Validate that the files are correctly added
     */
    expect(await run(`ls ${onContainerDir}`)).to.equal(
      subDirName,
      `${onContainerDir} in container dir should only contain ${subDirName}`
    );
    expect(await run(`ls ${onContainerSubDir}`)).to.equal(
      "",
      `${onContainerSubDir} should not contain any file`
    );
  }).timeout(60 * 1000);

  /**
   * NO backup - should throw
   */

  it("Should THROW if no backup is possible for nginx", async () => {
    let errorMessage = "---did not throw---";
    try {
      await backupGet({ id, backup });
    } catch (e) {
      errorMessage = e.message;
    }
    expect(errorMessage).to.include(
      "Could not backup any item",
      "Wrong error message"
    );
  }).timeout(60 * 1000);

  it("Should THROW if no restore backup is possible for nginx", async () => {
    let errorMessage = "---did not throw---";
    try {
      await backupRestore({ id, dataUri: dataUriEmpty, backup });
    } catch (e) {
      errorMessage = e.message;
    }
    expect(errorMessage).to.include(
      "Could not unbackup any item",
      "Wrong error message"
    );
  }).timeout(60 * 1000);

  after("Clean test docker container", async function() {
    this.timeout(60 * 1000);
    await cleanTestDir();
    await shell(`docker rm -f ${containerName}`);
  });
});
