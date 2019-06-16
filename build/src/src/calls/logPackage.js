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

  const logs = await docker.getDnpLogs(id, {
    tail: options.tail,
    timestamps: options.timestamp || options.timestamps
  });

  return {
    message: `Got logs of ${id}`,
    result: logs
  };
};

module.exports = logPackage;
