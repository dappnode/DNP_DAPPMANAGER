import os from "os";
import shellExec from "../utils/shell";
import { Diagnose } from "../types";

/**
 * Returns a list of checks done as a diagnose
 */
export async function diagnose(): Promise<Diagnose> {
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

  const platform = {
    name: "platform",
    ...uname()
  };

  return [dockerVersion, dockerComposeVersion, platform];
}

// Utils

/**
 * @param cmd
 * @returns Returns a formated object for the diagnose call
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

function uname(): {
  result?: string;
  error?: string;
} {
  try {
    return { result: [os.platform(), os.arch(), os.release()].join(", ") };
  } catch (e) {
    return { error: e.message };
  }
}
