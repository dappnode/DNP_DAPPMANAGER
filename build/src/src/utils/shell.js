const shell = require('shelljs');
const logs = require('logs.js')(module);

/*
 * Wrapper for shelljs. It the execution is not successful it throws an error.
 * It implements a default timeout, and exposes the silent flag.
*/

const maxTime = 3*60*1000;

async function shellExec(command, silent = false) {
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
    throw Error(err);
  }
  return stdout;
}

module.exports = shellExec;
