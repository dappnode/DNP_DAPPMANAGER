const fs = require("fs");
const parse = require("utils/parse");
const params = require("params");
const getPath = require("utils/getPath");
const validate = require("utils/validate");

/**
 * Loads a `.env` file from disk and parses its envs
 * @param {string} name
 * @param {bool} isCore
 * @returns {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
function loadEnvs(name, isCore) {
  const envFilePath = getPath.envFile(name, params, isCore);
  if (!fs.existsSync(envFilePath)) {
    return {};
  }
  const envFileData = fs.readFileSync(envFilePath, "utf8");
  return parse.envFile(envFileData);
}

/**
 * Stringifies an env object and write to an `.env` file to disk
 * @param {string} name
 * @param {bool} isCore
 * @param {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
function writeEnvs(name, isCore, envs) {
  const envFilePath = getPath.envFileSmart(name, params, isCore);
  fs.writeFileSync(validate.path(envFilePath), parse.stringifyEnvs(envs));
}

/**
 * Parses a manifest object to return an envs object
 * @param {object} manifest
 * @returns {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
function getManifestEnvs(manifest) {
  const envsArray = (manifest.image || {}).environment || [];
  return envsArray.reduce((obj, row) => {
    const [key, value] = (row || "").trim().split(/=(.*)/);
    obj[key] = value || "";
    return obj;
  }, {});
}

module.exports = {
  load: loadEnvs,
  write: writeEnvs,
  getManifestEnvs
};
