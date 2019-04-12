const dappGet = require("modules/dappGet");

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
const resolveRequest = async ({ req, options = {} }) => {
  if (!req) throw Error("kwarg req must be defined");

  /**
   * Resolve the request
   * @param {object} state = {
   * 'admin.dnp.dappnode.eth': '0.1.5'
   * }
   * @param {object} alreadyUpdated = {
   * 'bind.dnp.dappnode.eth': '0.1.4'
   * }
   * Forwards the options to dappGet:
   * - BYPASS_RESOLVER: if true, uses the dappGetBasic, which only fetches first level deps
   */
  const { message, state, alreadyUpdated } = await dappGet(req, options);

  return {
    message,
    result: {
      state,
      alreadyUpdated
    }
  };
};

module.exports = resolveRequest;
