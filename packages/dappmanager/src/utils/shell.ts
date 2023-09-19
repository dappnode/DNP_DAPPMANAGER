import util from "util";
import * as child from "child_process";
import { params } from "@dappnode/params";

const exec = util.promisify(child.exec);

const nsenterCommand = params.NSENTER_COMMAND;

/**
 * If timeout is greater than 0, the parent will send the signal
 * identified by the killSignal property (the default is 'SIGTERM')
 * if the child runs longer than timeout milliseconds.
 */
const defaultTimeout = 15 * 60 * 1000; // ms

/**
 * Run arbitrary commands in a shell in the DAPPMANAGER container
 * If the child process exits with code > 0, rejects
 */
export default async function shell(
  cmd: string | string[],
  options: { timeout?: number; maxBuffer?: number } = {}
): Promise<string> {
  const timeout = options.timeout || defaultTimeout;
  const maxBuffer = options && options.maxBuffer;
  const cmdStr = Array.isArray(cmd) ? cmd.join(" ") : cmd;
  try {
    const { stdout } = await exec(cmdStr, { timeout, maxBuffer });
    return (stdout || "").trim();
  } catch (e) {
    // Rethrow a typed error, and ignore the internal NodeJS stack trace
    const err: child.ExecException = e;
    if (err.signal === "SIGTERM")
      throw new ShellError(e, `process timeout ${timeout} ms, cmd: ${cmd}`);
    else throw new ShellError(e);
  }
}

/**
 * Run arbitrary commands in a shell in the host
 * [ALERT]: To use flags, you MUST add "--" before the first flag
 * `mkdir -p /some/dir` will fail, because the flag -p will be interpreted as
 * part of the `docker run ... nsenter` command
 * `mkdir -- -p /some/dir` will succeed
 */
export function shellHost(
  cmd: string,
  options?: { timeout?: number }
): Promise<string> {
  return shell(`${nsenterCommand} ${cmd}`, options);
}

/**
 * Typed error implementing the native node child exception error
 * Can be rethrow to ignore the internal NodeJS stack trace
 */
export class ShellError extends Error implements child.ExecException {
  cmd?: string;
  killed?: boolean;
  code?: number;
  signal?: NodeJS.Signals;
  stdout?: string;
  stderr?: string;
  constructor(
    e: child.ExecException & { stdout?: string; stderr?: string },
    message?: string
  ) {
    super(message || e.message);
    this.cmd = e.cmd;
    this.killed = e.killed;
    this.code = e.code;
    this.signal = e.signal;
    this.stdout = e.stdout;
    this.stderr = e.stderr;
  }
}
