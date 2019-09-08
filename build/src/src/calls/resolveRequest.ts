import dappGet from "../modules/dappGet";
import { PackageRequest, RpcHandlerReturn } from "../types";
import { DappGetState } from "../modules/dappGet/types";

interface RpcResolveRequestReturn extends RpcHandlerReturn {
  result: {
    state: DappGetState;
    alreadyUpdated: DappGetState;
  };
}

/**
 * Resolves a DNP request given the current repo state fetched
 * from the blockchain and the current installed DNPs versions
 *
 * @param {object} req, DNP request to resolve
 * req = {
 *   name: "otpweb.dnp.dappnode.eth", {string}
 *   ver: "0.1.4" {string}
 * }
 * @returns {object} result  = {
 *   state: {"admin.dnp.dappnode.eth": "0.1.4"},
 *   alreadyUpdated: {"bind.dnp.dappnode.eth": "0.1.2"},
 * }
 */
export default async function resolveRequest({
  req,
  options
}: {
  req: PackageRequest;
  options: {};
}): Promise<RpcResolveRequestReturn> {
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
   * @returns {object} = {
   *   message: "Found compatible state with case 1/256",
   *   state,
   *   alreadyUpdated
   * }
   *
   * In case of error, it will throw an error with a formated message
   */
  const { message, state, alreadyUpdated } = await dappGet(req, options);

  return {
    message,
    result: {
      state,
      alreadyUpdated
    }
  };
}
