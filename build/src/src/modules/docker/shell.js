const shell = require('shelljs');
const logs = require('../../logs')(module);

/*
 * Wrapper for shelljs. It the execution is not successful it throws an error.
 * It implements a default timeout, and exposes the silent flag.
 * Timeout set at 3 minutes as docker.load can take very long.
*/

const maxTime = 3*60*1000;

async function shellExecSync(command, silent = false, firstTry = true) {
  const res = await shell.exec(command, {silent: silent, timeout: maxTime});

  // When shell.exec timeout expires, res will be undefined
  if (!res) throw Error('ERROR: shell process: '+command+' expired timeout ('+maxTime+' ms)');

  // Otherwise, parse response
  const code = res.code;
  const stdout = res.stdout;
  const stderr = res.stderr;
  if (code !== 0) {
    // const err
    const err = stderr.length ? stderr : stdout;
    logs.error('SHELL JS ERROR, on command: ' + command+' err: '+err);

    // Automatically deal with specific docker errors:
    if (err.includes('find env file:')) {
      const envPath = err.split('Couldn\'t find env file:')[1].trim();
      logs.warn('RETRY SHELL JS command, creating envFile '+envPath);
      await shell.touch(envPath);
      await shellExecSync(command, silent, false);
    } else {
      throw Error(err);
    }
  }
  return stdout;
}

module.exports = shellExecSync;
