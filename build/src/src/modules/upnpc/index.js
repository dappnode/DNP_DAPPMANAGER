const shell = require('utils/shell');
const validateKwargs = require('./validateKwargs');
const parseOpenOutput = require('./parseOpenOutput');
const parseCloseOutput = require('./parseCloseOutput');
const parseListOutput = require('./parseListOutput');

// upnpc - interact with an external UPnP Internet Gateway Device
//
// setuc [ifn | cname]                      # Host interface to use
//
// upnpc -a ip port external_port tcp | udp # Add port mapping
// upnpc -d external_port tcp | udp         # Delete port mapping
// upnpc -e                                 # External IP address
// upnpc -i                                 # Initialize device list
// upnpc -s                                 # Status
// upnpc -l                                 # List port mappings
// upnpc -n ip                              # Get friendly name
// upnpc -r port1 tcp | udp [...]           # Map these ports to the host interface

// Available commands
// - open
// - close
// - list
// - status

/* eslint-disable max-len */

function upnpcCommand(cmd) {
  return shell(`docker inspect DAppNodeCore-vpn.dnp.dappnode.eth -f '{{.Config.Image}}'`, {trim: true}).then((image) => shell(`docker run --rm --net=host ${image} upnpc ${cmd} `));
}

const upnpc = {
  /**
   * Closes port = deletes port mapping
   * Actual command example:
   *   docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -r 500 UDP
   *
   * @param {Object} kwargs: {
   *   protocol: 'TCP',
   *   portNumber: '3000'
   * }
   * @return {*}
   */
  open: ({protocol, portNumber}) => {
    validateKwargs({protocol, portNumber});
    return upnpcCommand(`-e DAppNode -r ${portNumber} ${protocol}`).then(parseOpenOutput);
  },

  /**
   * Opens port = maps requested port to host
   * Actual command example:
   *   docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -d 500 UDP
   *
   * @param {Object} kwargs: {
   *   protocol: 'TCP',
   *   portNumber: '3000'
   * }
   * @return {*}
   */
  close: ({protocol, portNumber}) => {
    validateKwargs({protocol, portNumber});
    return upnpcCommand(`-e DAppNode -d ${portNumber} ${protocol}`).then(parseCloseOutput);
  },

  /**
   * Lists current port mapping for DAppNode
   * Actual command:
   *   docker run --rm --net=host ${IMAGE} upnpc -l
   *
   * @return {Array} port mappings = [
   *   {protocol: 'UDP', exPort: '500', inPort: '500'},
   *   {protocol: 'UDP', exPort: '4500', inPort: '4500'},
   *   {protocol: 'UDP', exPort: '30303', inPort: '30303'},
   *   {protocol: 'TCP', exPort: '30303', inPort: '30303'},
   * ]
   */
  list: () => upnpcCommand(`-l`).then(parseListOutput),
};

module.exports = upnpc;
