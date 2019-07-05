const expect = require("chai").expect;
const shell = require("utils/shell");
const path = require("path");
const db = require("db");
const fs = require("fs");
const { testDir, cleanTestDir, createTestDir } = require("./testUtils");

// Calls
const backupGet = require("calls/backupGet");
const backupRestore = require("calls/backupRestore");

// MUST use function for this.timeout to work <====== function() ???
describe("Integration test for backup to and from:", function() {
  /**
   * /etc/nginx/nginx.conf - single file 646 Bytes
   * /etc/nginx/conf.d - directory 8 KB
   */
  const content = "Amazing test content";
  const id = "test-backup.dnp.dappnode.eth";
  const containerName = `DAppNodePackage-${id}`;
  const backupFileCompName = "test-backup.dnp.dappnode.eth_backup.tar.xz";
  const fileId =
    "e08dbd0f654c0ae06c08570e731c8f14c079ec54ab7e58915d52290612b0a908";
  const dockerComposePath =
    "dnp_repo/test-backup.dnp.dappnode.eth/docker-compose.yml";

  const filePath =
    "DNCORE/.temp-transfer/test-backup.dnp.dappnode.eth_backup.tar.xz";

  /**
   * RESTORE => GET integral test
   * - Generate a fake backup file locally
   * - Restore it
   * - Get it
   * - Check it's the same
   *
   * Backup file structure
   * - config (= data.conf)
   * - sub-test/
   *   - data.conf
   */

  beforeEach("Up a test docker container", async function() {
    this.timeout(60 * 1000);
    await createTestDir();
    // Create container
    await shell(`docker-compose -f ${dockerComposePath} down -v -t 0`).catch(
      () => {}
    );

    await shell(`mkdir -p ${path.parse(dockerComposePath).dir}`);
    fs.writeFileSync(
      dockerComposePath,
      `version: '3.4'
services:
  ${id}:
    image: 'nginx:alpine'
    container_name: ${containerName}
    volumes:
      - 'test-demo:/test'
volumes:
  test-demo: {}
`
    );
    await shell(`docker-compose -f ${dockerComposePath} up -d`);
  });

  it("Should restore and download a backup for nginx", async () => {
    const backup = [
      { name: "config", path: "/test/data.conf" },
      { name: "test", path: "/test/sub-test" }
    ];

    // Create the backup data structure
    await shell(`mkdir -p ${path.join(testDir, "test")}`);
    await shell(`echo "${content}" > ${path.join(testDir, "config")}`);
    await shell(
      `echo "${content}" > ${path.join(testDir, "test", "data.conf")}`
    );
    // Create tar.xz backup file
    const dirListToComp = ["config", "test"].join(" ");
    const backupFileComp = path.join(testDir, backupFileCompName);

    await shell(`tar -czf ${backupFileComp} -C ${testDir} ${dirListToComp}`);
    await shell(`rm -rf ${path.join(testDir, "config")}`);
    await shell(`rm -rf ${path.join(testDir, "test")}`);

    // Store the fileId in the DB to simulate an HTTP upload
    await db.set(fileId, backupFileComp);
    // Create a fake docker-compose.yml for the restart call

    /**
     * Do restore
     */
    const resRestore = await backupRestore({ id, fileId, backup });
    expect(resRestore).to.be.ok;
    expect(resRestore.message).to.equal(
      "Restored backup test-backup.dnp.dappnode.eth, items: config, test",
      "Wrong response message for backupRestore"
    );

    /**
     * Do get
     */
    const resGet = await backupGet({ id, backup });
    expect(resGet).to.be.ok;
    expect(resGet.message).to.equal(
      "Backup test-backup.dnp.dappnode.eth, items: config, test",
      "Wrong response message for backupGet"
    );
    expect(resGet.result).to.be.a("string");
    // res.result = "e08dbd0f654c0ae06c08570e731c8f14c079ec54ab7e58915d52290612b0a908"
    expect(await db.get(resGet.result)).to.equal(filePath);

    /**
     * [NOTE] validate the generated file, assuming it's not deterministic
     *
     */
    await createTestDir();
    await shell(`tar -xf ${filePath} -C ${testDir}`);

    // Check the file contents
    const backupFileContent = await shell(
      `cat ${path.join(testDir, "config")}`
    );
    expect(backupFileContent).to.equal(
      content,
      `Backup file (config) contents are incorrect`
    );
    // Check the dir contents
    const backupSubDirContent = await shell(
      `cat ${path.join(testDir, "test/data.conf")}`
    );
    expect(backupSubDirContent).to.equal(
      content,
      `Backup sub dir file (test/data.conf) contents are incorrect`
    );
  }).timeout(60 * 1000);

  after("Clean test docker container", async function() {
    this.timeout(60 * 1000);
    await cleanTestDir();
    await shell(`docker rm -f ${containerName}`);
  });
});
