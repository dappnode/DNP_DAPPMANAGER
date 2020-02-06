// ERROR - no UPNP DEVICE:

// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// No IGD UPnP Device found on the network !

export default function parseGeneralErrors(terminalOutput: string): string {
  const noUpnpAvailable =
    RegExp(/No IGD UPnP Device found/, "i").test(terminalOutput) ||
    RegExp(/No valid UPNP Internet Gateway Device/, "i").test(terminalOutput);
  if (noUpnpAvailable) throw Error("NOUPNP: No UPnP device available");

  return terminalOutput;
}
