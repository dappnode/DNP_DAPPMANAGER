const parseGeneralErrors = require("./parseGeneralErrors");
const validateKwargs = require("./validateKwargs");

// SUCCESSFUL: Open a NON existing port
// (ERROR): Open an already openned port (same output)

// dappnode@machine:/usr/src/dappnode/DNCORE$ docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -r 4002 UDP
// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// List of UPNP devices found on the network :
//  desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
//  st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

// Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
// Local LAN ip address : 192.168.1.01
// ExternalIPAddress = 85.84.83.82
// InternalIP:Port = 192.168.1.01:4002
// external 85.84.83.82:4002 UDP is redirected to internal 192.168.1.01:4002 (duration=0)

// ERROR - no UPNP DEVICE:

// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// No IGD UPnP Device found on the network !

/**
 *
 * @param {String} terminalOutput A sample can be found above
 * @return {*}
 */
function parseOpenOutput(terminalOutput) {
  validateKwargs({ terminalOutput });
  parseGeneralErrors(terminalOutput);

  // Get the last line of the output
  const lines = terminalOutput.trim().split(/\r?\n/);
  const lastLine = lines[lines.length - 1];

  // Check if is contains "is redirected"
  const okRegex = RegExp(/is.redirected/);
  if (okRegex.test(lastLine)) {
    return true;
  }
}

module.exports = parseOpenOutput;
