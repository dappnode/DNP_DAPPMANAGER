import util from "util";
import * as child from "child_process";
import params from "../params";

const exec = util.promisify(child.exec);

const nsenterCommand = params.NSENTER_COMMAND;

/**
 * If this method is invoked as its util.promisify()ed version,
 * it returns a Promise for an Object with stdout and stderr properties.
 * In case of an error (including any error resulting in an exit code other than 0),
 * a rejected promise is returned, with the same error object given in the callback,
 * but with an additional two properties stdout and stderr.
 */

/**
 * If timeout is greater than 0, the parent will send the signal
 * identified by the killSignal property (the default is 'SIGTERM')
 * if the child runs longer than timeout milliseconds.
 */
const defaultTimeout = 15 * 60 * 1000; // ms

/**
 * Run arbitrary commands in a shell in the DAPPMANAGER container
 */
export default function shell(
  cmd: string,
  options?: { timeout?: number }
): Promise<string> {
  const timeout = options && options.timeout ? options.timeout : defaultTimeout;
  return exec(cmd, { timeout })
    .then(res => (res.stdout || "").trim())
    .catch(err => {
      if (err.signal === "SIGTERM") {
        throw Error(`cmd "${err.cmd}" timed out (${timeout} ms)`);
      }
      throw err;
    });
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
 * About the error object
 * ======================
 *
 * Sample error object:

Error: Command failed: cat aa.txt
cat: aa.txt: No such file or directory

user-laptop:src user$ node src/utils/test.js
{ Error: Command failed: cat aa.txt
cat: aa.txt: No such file or directory

    at ChildProcess.exithandler (child_process.js:276:12)
    at emitTwo (events.js:126:13)
    at ChildProcess.emit (events.js:214:7)
    at maybeClose (internal/child_process.js:915:16)
    at Socket.stream.socket.on (internal/child_process.js:336:11)
    at emitOne (events.js:116:13)
    at Socket.emit (events.js:211:7)
    at Pipe._handle.close [as _onclose] (net.js:561:12)
  killed: false,
  code: 1,
  signal: null,
  cmd: 'cat aa.txt',
  stdout: '',
  stderr: 'cat: aa.txt: No such file or directory\n' }

 * Conclusion
 * ==========
 *
 * Using child_process it's best to just rethrow the recieved error.
 */
