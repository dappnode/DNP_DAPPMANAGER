import { ShhStatus, SshManager } from "../../modules/sshManager";

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

  sshPortChange = async ({ port }: { port: number }): Promise<void> => {
    await this.sshManager.changePort(port);
  };
}
