const shellExec = require("utils/shell");

/**
 * @param {String} cmd
 * @return {Object} in case of success:
 * { result: 'Docker version 18.06.1-ce, build e68fc7a' }
 *   in case of error:
 * { error: 'sh: docker: not found' }
 */
const shellExecFormated = cmd =>
  shellExec(cmd)
    .then(data => ({ result: (data || "").trim() }))
    .catch(e => ({ error: e.message }));

/**
 * Returns a list of checks done as a diagnose
 *
 * @return {Object} A formated list of messages.
 * result: diagnose =
 *   {
 *     dockerVersion: {
 *       name: 'docker version',
 *       result: 'Docker version 18.06.1-ce, build e68fc7a'
 *       <or>
 *       error: 'sh: docker: not found'
 *     }
 *   }
 */
const getStats = async () => {
  const diagnose = {};

  // Get docker version
  diagnose.dockerVersion = {
    name: "docker version",
    ...(await shellExecFormated(`docker -v`))
  };

  // Get docker compose version
  diagnose.dockerComposeVersion = {
    name: "docker compose version",
    ...(await shellExecFormated(`docker-compose -v`))
  };

  return {
    message: `Diagnose of this DAppNode server`,
    result: diagnose
  };
};

module.exports = getStats;
