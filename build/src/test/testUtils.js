const shell = require("utils/shell");
const path = require("path");

const testDir = "./test_files/";

function ignoreErrors(fn) {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (e) {
      // Ignore
    }
  };
}

async function cleanTestDir() {
  await shell(`rm -rf ${testDir}`);
}
async function createTestDir() {
  await cleanTestDir();
  await shell(`mkdir -p ${testDir}`);
}

async function createDirP(filePath) {
  await shell(`mkdir -p ${path.parse(filePath).dir}`);
}

module.exports = {
  testDir,
  cleanTestDir,
  createTestDir,
  createDirP,
  ignoreErrors
};
