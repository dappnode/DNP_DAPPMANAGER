import { ReturnData } from "../route-types/diagnose";
import shellExec from "../utils/shell";
import { RpcHandlerReturnWithResult } from "../types";

/**
 * Returns a list of checks done as a diagnose
 */
export default async function diagnose(): RpcHandlerReturnWithResult<
  ReturnData
> {
  // Get docker version: "Docker version 18.06.1-ce, build e68fc7a"
  const dockerVersion = {
    name: "docker version",
    ...(await shellExecFormated(`docker -v`))
  };

  // Get docker compose version
  const dockerComposeVersion = {
    name: "docker compose version",
    ...(await shellExecFormated(`docker-compose -v`))
  };

  return {
    message: `Diagnose of this DAppNode server`,
    result: [dockerVersion, dockerComposeVersion]
  };
}

// Utils

/**
 * @param {string} cmd
 * @returns {object} Returns a formated object for the diagnose call
 * - On success:
 *   { result: 'Docker version 18.06.1-ce, build e68fc7a' }
 * - On error:
 *   { error: 'sh: docker: not found' }
 */
function shellExecFormated(
  cmd: string
): Promise<{
  result?: string;
  error?: string;
}> {
  return shellExec(cmd)
    .then((data: string) => ({ result: (data || "").trim() }))
    .catch((e: Error) => ({ error: e.message }));
}
