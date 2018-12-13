const dappGet = require('modules/dappGet');
const dappGetBasic = require('modules/dappGet/basic');

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
  options = {},
}) => {
    // result = {
    //     success: {'bind.dnp.dappnode.eth': '0.1.4'}
    //     alreadyUpdated: {'bind.dnp.dappnode.eth': '0.1.2'}
    // }
    const result = options.BYPASS_RESOLVER
    ? await dappGetBasic(req)
    : await dappGet(req);
    await dappGet.update(req);

    return {
        message: 'Resolve request for ' + req.name + '@' + req.ver+
            ', resolved: '+Boolean(result.success),
        result,
    };
};


module.exports = removePackage;
