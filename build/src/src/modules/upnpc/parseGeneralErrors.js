// ERROR - no UPNP DEVICE:

// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// No IGD UPnP Device found on the network !

function parseGeneralErrors(terminalOutput) {
  const noDeviceFoundRegex = RegExp(/no.+device found/);
  if (noDeviceFoundRegex.test((terminalOutput || '').toLowerCase())) {
    throw Error('NOUPNP: No UPnP device available');
  }
  return terminalOutput;
}

module.exports = parseGeneralErrors;
