const fs = require("fs");
const getPath = require("utils/getPath");
const parse = require("utils/parse");
const params = require("params");
const docker = require("modules/docker");

/**
 * Returns the logs of the docker container of a package
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   options: log options (object)
 * }
 * @return {Object} A formated success message.
 * result: logs: <String with escape codes> (string)
 */
const logPackage = async ({ id, options }) => {
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
