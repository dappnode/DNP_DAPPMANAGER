const dappGet = require('modules/dappGet');

/**
 * Remove package data: docker down + disk files
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   deleteVolumes: flag to also clear permanent package data
 *   logId: task id (string)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const removePackage = async ({
  req,
}) => {
    await dappGet.update(req);
    const result = await dappGet.resolve(req);

    return {
        message: 'Resolve request for ' + req.name + '@' + req.ver+
            ', resolved: '+Boolean(result.success),
        result,
    };
};


module.exports = removePackage;
