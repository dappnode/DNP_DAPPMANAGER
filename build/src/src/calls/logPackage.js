const wrapMethodsWithQueue = require("utils/wrapMethodsWithQueue");
// Modules
const dockerList = require("modules/dockerList");
const docker = require("modules/docker");

// Retry logs call 3 times, in case it happen during a container reboot
const dockerWithRetry = wrapMethodsWithQueue(
  { log: docker.log },
  { times: 3 },
  { disableChecks: true }
);

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

  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(p => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  const logs = await dockerWithRetry.log(containerName, options);

  return {
    message: `Got logs of ${id}`,
    result: logs
  };
};

module.exports = logPackage;
