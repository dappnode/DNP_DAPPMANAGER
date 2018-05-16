const shell = require('shelljs')

async function shellExecSync(command) {

  let { code, stdout, stderr } = await shell.exec(command, { silent: true })
  if (code !== 0) {
    if (command.includes('docker-compose')
    && stderr.includes('Please')
    && stderr.includes('\`')) {

      let _command = stderr.split('\`')[1]
      console.trace('AUTOMATICALLY CREATING REQUEST docker-compose INSTRUCTION: ' + _command)
      await shellExecSync(_command)
      await shellExecSync(command)

    } else {
      throw Error(stderr)
    }
  }

  return stdout

}

module.exports = shellExecSync
