const shell = require('shelljs');
const logs = require('logs.js')(module);

const maxTime = 20*1000;

async function shellExecSync(command, silent = false) {
  const res = await shell.exec(command, {silent: silent, timeout: maxTime});

  // When shell.exec timeout expires, res will be undefined
  if (!res) throw Error('ERROR: shell process: '+command+' expired timeout ('+maxTime+' ms)');

  // Otherwise, parse response
  const code = res.code;
  const stdout = res.stdout;
  const stderr = res.stderr;
  if (code !== 0) {
    logs.error('SHELL JS ERROR, on command: ' + command);
    throw Error(stderr);
  }
  return stdout;
}

module.exports = shellExecSync;
