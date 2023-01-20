import { SshManager } from "@dappnode/dappmanager/src/modules/sshManager";
import { pause } from "./utils";
import { ShhStatus } from "@dappnode/common";

async function shellHostDelay() {
  await pause(1000 + 1000 * Math.random());
}

export class MockSshManager implements SshManager {
  status: ShhStatus;
  port: number;
  readonly shellHost: any;

  constructor() {
    this.status = "enabled";
    this.port = 22;
  }

  async enable(): Promise<void> {
    await shellHostDelay();
    this.status = "enabled";
  }

  async disable(): Promise<void> {
    await shellHostDelay();
    this.status = "disabled";
  }

  async getStatus(): Promise<ShhStatus> {
    await shellHostDelay();
    return this.status;
  }

  async getPort(): Promise<number> {
    await shellHostDelay();
    return this.port;
  }

  async setPort(port: number): Promise<void> {
    await shellHostDelay();
    this.port = port;
  }

  async removeRootAccess(): Promise<void> {}
}
