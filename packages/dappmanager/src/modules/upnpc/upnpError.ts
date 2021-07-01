export function parseUpnpErrors(terminalOutput: string): UpnpError {
  if (isUpnpAvailable(terminalOutput))
    return new UpnpError(terminalOutput, UPnPErrors.UPNPNOTAVAIL);
  if (isNotExistingPort(terminalOutput))
    return new UpnpError(terminalOutput, UPnPErrors.UPNPNOTPORT);
  return new UpnpError(terminalOutput, UPnPErrors.UNKNOWN);
}

function isUpnpAvailable(terminalOutput: string): boolean {
  return !(
    RegExp(/No IGD UPnP Device found/, "i").test(terminalOutput) ||
    RegExp(/No valid UPNP Internet Gateway Device/, "i").test(terminalOutput)
  );
}

function isNotExistingPort(terminalOutput: string): boolean {
  const lines = terminalOutput.trim().split(/\r?\n/);
  const lastLine = lines[lines.length - 1] || "";

  // Check if it contains "failed"
  return lastLine.includes("failed");
}

export class UpnpError extends Error {
  terminalOutput: string;
  typeUpnpError: UPnPErrors;

  constructor(terminalOutput: string, typeUpnpError: UPnPErrors) {
    super(`UPnP Error: ${typeUpnpError}\nError:${terminalOutput}`);
    this.terminalOutput = terminalOutput;
    this.typeUpnpError = typeUpnpError;
  }
}

// UPNPNOTAVAIL: UPnP is not available
// UPNPNOTPORT: UPnP not existing port
// UNKNOWN: UPnP unclassified error
// Research for more errors!
export enum UPnPErrors {
  "UPNPNOTAVAIL",
  "UPNPNOTPORT",
  "UNKNOWN"
}
