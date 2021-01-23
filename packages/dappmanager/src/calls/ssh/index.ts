import { SshManager } from "../../modules/sshManager";
import { ShhStatus } from "../../types";

// ### TODO: Review this numbers
const maxPortNumber = 32600;
const minPortNumber = 22;

export interface SshCallsModules {
  sshManager: SshManager;
}

export class SshCalls {
  sshManager: SshManager;

  constructor({ sshManager }: SshCallsModules) {
    this.sshManager = sshManager;
  }

  sshStatusSet = async ({
    status
  }: {
    status: "enabled" | "disabled";
  }): Promise<void> => {
    switch (status) {
      case "enabled":
        return await this.sshManager.enable();
      case "disabled":
        return await this.sshManager.disable();
      default:
        throw Error(`Unknown status ${status}`);
    }
  };

  sshStatusGet = async (): Promise<ShhStatus> => {
    return await this.sshManager.getStatus();
  };

  sshPortSet = async ({ port }: { port: number }): Promise<void> => {
    if (isNaN(port) || !isFinite(port)) throw Error(`Invalid port ${port}`);
    if (port > maxPortNumber)
      throw Error(`Port ${port} over maxPortNumber ${maxPortNumber}`);
    if (port < minPortNumber)
      throw Error(`Port ${port} under minPortNumber ${minPortNumber}`);

    await this.sshManager.setPort(port);
  };

  sshPortGet = async (): Promise<number> => {
    return await this.sshManager.getPort();
  };
}
