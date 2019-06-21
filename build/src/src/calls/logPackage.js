const fs = require("fs");
const getPath = require("utils/getPath");
const parse = require("utils/parse");
const params = require("params");
const docker = require("modules/docker");

/**
 * Returns the logs of the docker container of a package
 *
 * @param {string} id DNP .eth name
 * @param {object} options log options
 * - timestamp {bool}: Show timestamps
 * - tail {number}: Number of lines to return from bottom
 * options = { timestamp: true, tail: 200 }
 * @returns {string} logs: <string with escape codes>
 */
const logPackage = async ({ id, options = {} }) => {
  if (!id) throw Error("kwarg id must be defined");

  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error(`No docker-compose found: ${dockerComposePath}`);
  }

  const containerName = parse.containerName(dockerComposePath);
  const logs = await docker.log(containerName, options);

  return {
    message: `Got logs of ${id}`,
    result: logs
  };
};

module.exports = logPackage;
