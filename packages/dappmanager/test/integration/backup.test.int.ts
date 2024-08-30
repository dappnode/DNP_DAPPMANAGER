import "mocha";
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import * as db from "@dappnode/db";
import { shell } from "@dappnode/utils";
import {
  testDir,
  cleanTestDir,
  createTestDir,
  clearDbs,
  shellSafe
} from "../testUtils.js";

// Calls
import { backupGet } from "../../src/calls/backupGet.js";
import { backupRestore } from "../../src/calls/backupRestore.js";

// MUST use function for this.timeout to work <====== function() ???
describe("Integration test for backup to and from:", function () {
  /**
   * /etc/nginx/nginx.conf - single file 646 Bytes
   * /etc/nginx/conf.d - directory 8 KB
   */
  const content = "Amazing test content";
  const dnpName = "test-backup.dnp.dappnode.eth";
  const containerName = `DAppNodePackage-${dnpName}`;
  const backupFileCompName = "test-backup.dnp.dappnode.eth_backup.tar.xz";
  const fileId =
    "e08dbd0f654c0ae06c08570e731c8f14c079ec54ab7e58915d52290612b0a908";
  const dockerComposePath =
    "dnp_repo/test-backup.dnp.dappnode.eth/docker-compose.yml";

  const filePath = ".temp-transfer/test-backup.dnp.dappnode.eth_backup.tar.xz";

  before(async () => {
    clearDbs();
  });

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

  beforeEach("Up a test docker container", async function () {
    await createTestDir();
    // Create container
    await shellSafe(`docker compose -f ${dockerComposePath} down -v -t 0`);

    await shell(`mkdir -p ${path.parse(dockerComposePath).dir}`);
    fs.writeFileSync(
      dockerComposePath,
      `version: '3.5'
services:
  ${dnpName}:
    image: 'nginx:alpine'
    container_name: ${containerName}
    volumes:
      - 'test-demo:/test'
volumes:
  test-demo: {}
`
    );
    await shell(`docker compose -f ${dockerComposePath} up -d`);
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
    db.fileTransferPath.set(fileId, backupFileComp);
    // Create a fake docker-compose.yml for the restart call

    /**
     * Do restore
     */
    await backupRestore({ dnpName, fileId, backup });
    // expect(resRestore.message).to.equal(
    //   "Restored backup test-backup.dnp.dappnode.eth, items: config, test",
    //   "Wrong response message for backupRestore"
    // );

    /**
     * Do get
     */
    const resultGet = await backupGet({ dnpName, backup });
    // expect(resGet.message).to.equal(
    //   "Backup test-backup.dnp.dappnode.eth, items: config, test",
    //   "Wrong response message for backupGet"
    // );
    expect(resultGet).to.be.a("string");
    // resultGet = "e08dbd0f654c0ae06c08570e731c8f14c079ec54ab7e58915d52290612b0a908"
    expect(db.fileTransferPath.get(resultGet)).to.equal(filePath);

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
  });

  after("Clean test docker container", async function () {
    await cleanTestDir();
    await shell(`docker rm -f -v ${containerName}`);
    await shellSafe(`docker compose -f ${dockerComposePath} down -v -t 0`);
  });
});
