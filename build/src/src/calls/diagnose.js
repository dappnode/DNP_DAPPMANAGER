const shellExec = require('utils/shell');

/**
 * Returns a list of checks done as a diagnose
 *
 * @return {Object} A formated list of messages.
 * result: diagnose =
 *   {
 *     dockerVersion: {
 *       name: 'docker version',
 *       result: 'Docker version 18.06.1-ce, build e68fc7a' <or>
 *       error: 'sh: docker: not found'
 *     }
 *   }
 */
const getStats = async () => {
    /* eslint-disable max-len */
    const diagnose = {};

    // Get docker version
    diagnose.dockerVersion = {
        name: 'docker version',
        ...(await shellExec(`docker -v`)
            .then((data) => data.trim())
            .then((result) => ({result}))
            .catch((e) => ({error: e.message}))),
    };

    // Get docker compose version
    diagnose.dockerComposeVersion = {
        name: 'docker compose version',
        ...(await shellExec(`docker-compose -v`)
            .then((data) => data.trim())
            .then((result) => ({result}))
            .catch((e) => ({error: e.message}))),
    };

    return {
        message: `Diagnose of this DAppNode server`,
        result: diagnose,
    };
};


module.exports = getStats;

