import shellExec from "../utils/shell";

/**
 * Returns a list of checks done as a diagnose
 *
 * @returns {object} diagnoses object, by diagnose id
 * diagnoses = {
 *   "dockerVersion": {
 *     name: "docker version",
 *     result: "Docker version 18.06.1-ce, build e68fc7a"
 *     error: "sh: docker: not found"
 *   } // either "result" or "error" prop will exist
 * }
 */
export default async function diagnose() {
  // Get docker version
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
function shellExecFormated(cmd: string) {
  return shellExec(cmd)
    .then((data: string) => ({ result: (data || "").trim() }))
    .catch((e: Error) => ({ error: e.message }));
}
