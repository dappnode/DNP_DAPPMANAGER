import {
  SshManager,
  ShhStatus
} from "@dappnode/dappmanager/src/modules/sshManager";

export class MockSshManager implements SshManager {
  status: ShhStatus;
  port: number;
  readonly shellHost: any;

  constructor() {
    this.status = "enabled";
    this.port = 22;
  }

  async enable(): Promise<void> {
    this.status = "enabled";
  }

  async disable(): Promise<void> {
    this.status = "disabled";
  }

  async getStatus(): Promise<ShhStatus> {
    return this.status;
  }

  async changePort(port: number): Promise<void> {
    this.port = port;
  }

  async removeRootAccess(): Promise<void> {}
}
