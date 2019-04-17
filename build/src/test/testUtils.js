const shell = require("utils/shell");

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
  await shell(`mkdir -p ${testDir}`);
}

module.exports = {
  testDir,
  cleanTestDir,
  createTestDir,
  ignoreErrors
};
