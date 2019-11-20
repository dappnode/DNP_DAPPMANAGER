import versionData from "../utils/getVersionData";
import { PackageVersionData, RpcHandlerReturnWithResult } from "../types";

type ReturnData = PackageVersionData;

/**
 * Returns the version data of this specific build
 *
 * @returns {object} versionData = {
 *   version: "0.1.21",
 *   branch: "master",
 *   commit: "ab991e1482b44065ee4d6f38741bd89aeaeb3cec"
 * }
 */
export default async function getVersionData(): RpcHandlerReturnWithResult<
  ReturnData
> {
  return {
    message: "Got version data",
    result: versionData
  };
}
