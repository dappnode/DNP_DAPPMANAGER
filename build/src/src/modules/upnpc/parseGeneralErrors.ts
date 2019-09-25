// ERROR - no UPNP DEVICE:

// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// No IGD UPnP Device found on the network !

export default function parseGeneralErrors(terminalOutput: string): string {
  const upnpAvailable = RegExp(/Found valid IGD/, "i").test(terminalOutput);
  if (!upnpAvailable) throw Error("NOUPNP: No UPnP device available");

  return terminalOutput;
}
