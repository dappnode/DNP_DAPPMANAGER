
// Expects:
// arg[0] a stdout string from a docker-compose ps
// arg[1] a string with the packageName: i.e. otpweb.dnp.dappnode.eth
function containerStateFromPs(dockerPsOutput, container_name) {

  let containers = parsePs(dockerPsOutput)
  let container = containers.find(c => c.name == container_name)
  if (!container) {
    return 'Down'
  } else if ('state' in container) {
    return container.state
  } else {
    return 'Unkown'
  }

}


function parsePs(output) {
  let rows = output
    .split('\n')
    .filter(row => row.replace(/\s/g, '').length)
    // remove row only contained whitespace (ie. spaces, tabs or line breaks)

  namesRow = rows[0]
  containerRows = rows.slice(2)

  let propNames = namesRow
    .split('  ')
    .filter(e => e != '')
    .map(e => e.trim().toLowerCase())

  // If the docker-compose ps format changes, this may alert it
  if (propNames.length != 4) {
    console.warning('docker-compose ps format may have changed, raw output:\n'+output)
  } else if (propNames[0] != 'name'
  || propNames[1] != 'command'
  || propNames[2] != 'state'
  || propNames[3] != 'ports') {
    console.warning('docker-compose ps format may have changed, raw output:\n'+output)
  }

  return containerRows
    .filter(row => row.length > 1)
    .map((row) => {
    let containerProps = row
      .split('  ')
      .filter(e => e != '')
      .map(e => e.trim())

    return {
      name: containerProps[0],
      command: containerProps[1],
      state: containerProps[2],
      ports: containerProps[3] || '',
    }

  })
}


module.exports = {
  parsePs,
  containerStateFromPs
}
