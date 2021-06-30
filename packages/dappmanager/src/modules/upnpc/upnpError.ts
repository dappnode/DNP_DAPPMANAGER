// ERROR - no UPNP DEVICE:

// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// No IGD UPnP Device found on the network !

export class UpnpError extends Error {
  command: string;
  terminalOutput: string;
  isUpnpAvailable: boolean;
  isPortExisting: boolean;

  constructor({
    terminalOutput,
    command
  }: {
    terminalOutput: string;
    command: string;
  }) {
    super(`UPnP error. Command failed: ${command}. Error: ${terminalOutput}`);
    this.command = command;
    this.terminalOutput = terminalOutput;
    this.isUpnpAvailable = this.getUpnpAvailable();
    this.isPortExisting = this.getPortExists();
  }

  getUpnpAvailable(): boolean {
    return !(
      RegExp(/No IGD UPnP Device found/, "i").test(this.terminalOutput) ||
      RegExp(/No valid UPNP Internet Gateway Device/, "i").test(
        this.terminalOutput
      )
    );
  }

  getPortExists(): boolean {
    const lines = this.terminalOutput.trim().split(/\r?\n/);
    const lastLine = lines[lines.length - 1] || "";

    // Check if it contains "failed"
    return lastLine.includes("failed");
  }
}
