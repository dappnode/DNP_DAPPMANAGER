const parseGeneralErrors = require("./parseGeneralErrors");
const validateKwargs = require("./validateKwargs");

// SUCCESSFUL: Close an existing port

// dappnode@machine:/usr/src/dappnode/DNCORE$ docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -d 4002 UDP
// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// List of UPNP devices found on the network :
//  desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
//  st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

// Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
// Local LAN ip address : 192.168.1.01
// UPNP_DeletePortMapping() returned : 0

// ERROR: Close a NON existing port

// dappnode@machine:/usr/src/dappnode/DNCORE$ docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -d 40025 UDP
// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// List of UPNP devices found on the network :
//  desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
//  st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

// Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
// Local LAN ip address : 192.168.1.01
// UPNP_DeletePortMapping() failed with code : 714

// ERROR: no UPnP device found

// root@lionDAppnode:/usr/src/dappnode/DNCORE# docker run --rm --net=host ${IMAGE} upnpc -s
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
function parseCloseOutput(terminalOutput) {
  validateKwargs({ terminalOutput });
  parseGeneralErrors(terminalOutput);

  // Get the last line of the output
  const lines = terminalOutput.trim().split(/\r?\n/);
  const lastLine = lines[lines.length - 1];

  // Check if it contains "failed"
  if (lastLine.includes("failed")) {
    const errorMessage = "failed " + (lastLine.split("failed")[1] || "").trim();
    throw Error(`Error closing port: ${errorMessage}`);
  }

  // Check if is contains "returned.0"
  const okRegex = RegExp(/returned.+0/);
  if (okRegex.test(lastLine)) {
    return true;
  }
}

module.exports = parseCloseOutput;
