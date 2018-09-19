const dappGet = require('modules/dappGet');

/**
 * Remove package data: docker down + disk files
 *
 * @param {Object} kwargs: {
 *   req: {
 *        name: 'otpweb.dnp.dappnode.eth', <string>
 *        ver: '0.1.4' <string>
 *      }
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
