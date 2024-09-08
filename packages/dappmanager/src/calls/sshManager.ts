import { ShhStatus } from "@dappnode/types";
import { ShellError, shellHost } from "@dappnode/utils";

type ShellHost = (cmd: string) => Promise<string>;

class SshManager {
  private readonly shellHost: ShellHost;

  // ### TODO: Review these numbers
  private readonly maxPortNumber = 32600;
  private readonly minPortNumber = 22;

  constructor({ shellHost }: { shellHost: ShellHost }) {
    this.shellHost = shellHost;
  }

  /**
   * Start and enable ssh.service (sshd)
   */
  private async enable(): Promise<void> {
    // Sample response if disabled
    // ---------------------------
    // [root@DAppNodeLion:/usr/src/dappnode/DNCORE]# systemctl enable ssh.service
    // Synchronizing state of ssh.service with SysV service script with /lib/systemd/systemd-sysv-install.
    // Executing: /lib/systemd/systemd-sysv-install enable ssh

    // --now
    //     When used with enable, the units will also be started. When used with disable or mask, the units will also be stopped
    //     The start or stop operation is only carried out when the respective enable or disable operation has been successful.
    // From https://www.freedesktop.org/software/systemd/man/systemctl.html
    // NOTE: "--" MUST be used to make the flag and the command work
    await this.shellHost("systemctl enable -- --now ssh.service");
  }

  /**
   * Stop and disable ssh.service (sshd)
   */
  private async disable(): Promise<void> {
    // Sample response if disabled
    // ---------------------------
    // [root@DAppNodeLion:/usr/src/dappnode/DNCORE]# systemctl disable ssh.service
    // Synchronizing state of ssh.service with SysV service script with /lib/systemd/systemd-sysv-install.
    // Executing: /lib/systemd/systemd-sysv-install disable ssh

    // --now
    //     When used with enable, the units will also be started. When used with disable or mask, the units will also be stopped
    //     The start or stop operation is only carried out when the respective enable or disable operation has been successful.
    // From https://www.freedesktop.org/software/systemd/man/systemctl.html
    // NOTE: "--" MUST be used to make the flag and the command work
    await this.shellHost("systemctl disable -- --now ssh.service");
  }

  /**
   * Call systemctl and check if ssh.service (sshd) is active
   */
  private async getStatus(): Promise<ShhStatus> {
    // # Status

    // is-active PATTERN...
    //     Check whether any of the specified units are active (i.e. running).
    //     Returns an exit code 0 if at least one is active, or non-zero otherwise.
    //     Unless --quiet is specified, this will also print the current unit state to standard output.
    // From https://www.freedesktop.org/software/systemd/man/systemctl.html

    // Sample response if active, exit code 0
    // -------------------------
    // [root@DAppNodeLion:/usr/src/dappnode/DNCORE]# systemctl is-active sshd
    // active

    // Sample response if inactive, exit code 3
    // ---------------------------
    // [root@DAppNodeLion:/usr/src/dappnode/DNCORE]# systemctl is-active sshd
    // inactive

    try {
      // shellHost("systemctl is-active sshd") returns
      // 'active'
      await this.shellHost("systemctl is-active ssh");
      return "enabled";
    } catch (e) {
      // Error: Command failed: docker run --rm --privileged --pid=host -t alpine:3.8 nsenter -t 1 -m -u -n -i systemctl is-active sshd
      //   at /usr/src/app/webpack:/src/utils/shell.ts:37:16
      //   at Generator.throw (<anonymous>)
      //   at rejected (/usr/src/app/index.js:19405:65)
      //   at process._tickCallback (internal/process/next_tick.js:68:7)
      // cmd:
      //  'docker run --rm --privileged --pid=host -t alpine:3.8 nsenter -t 1 -m -u -n -i systemctl is-active sshd',
      // killed: false,
      // code: 3,
      // signal: null,
      // stdout: 'inactive\r\n',
      // stderr: ''
      if (e instanceof ShellError) {
        // Only return disabled if you can verify that the command error-ed because
        // it's actually inactive and not due to an nsenter error
        const output = (e.stdout || e.stderr || "").trim();
        if (output.toLowerCase().startsWith("inactive")) {
          return "disabled";
        }
      }
      e.message = `Error getting SSH status: ${e.message}`;
      throw e;
    }
  }

  /**
   * Change SSH port by modifing /etc/ssh/sshd_config
   * Then restarts ssh.service (sshd)
   */
  private async setPort(port: number): Promise<void> {
    if (isNaN(port)) throw Error(`Port is not a number: ${port}`);
    if (port <= 0) throw Error(`Port must be > 0: ${port}`);
    if (port >= 65536) throw Error(`Port must be < 65536: ${port}`);

    // NOTE: "--" MUST be used to make the flag and the command work
    await this.shellHost(`sed -- -i "s/.*Port .*/Port ${port}/g" /etc/ssh/sshd_config`);
    await this.shellHost("systemctl restart ssh.service");
  }

  /**
   * Cat /etc/ssh/sshd_config and parse the line
   * ```
   * Port 22
   * ```
   * to get the current port
   */
  private async getPort(): Promise<number> {
    const sshdConfig = await this.shellHost("cat /etc/ssh/sshd_config");

    const regexMatch = sshdConfig.match(/Port (\d+)/);
    if (!regexMatch) throw Error("Error parsing sshd_config");

    const portNumber = parseInt(regexMatch[1]);
    if (isNaN(portNumber)) throw Error("Error parsing sshd_config");
    return portNumber;
  }

  async removeRootAccess(): Promise<void> {
    // NOTE: "--" MUST be used to make the flag and the command work
    await this.shellHost(`sed -- -i "s/.*PermitRootLogin .*/PermitRootLogin no/g" /etc/ssh/sshd_config`);
  }

  // Public methods from SshCalls are added below:

  public async sshStatusSet({ status }: { status: "enabled" | "disabled" }): Promise<void> {
    switch (status) {
      case "enabled":
        return await this.enable();
      case "disabled":
        return await this.disable();
      default:
        throw Error(`Unknown status ${status}`);
    }
  }

  public async sshStatusGet(): Promise<ShhStatus> {
    return await this.getStatus();
  }

  public async sshPortSet({ port }: { port: number }): Promise<void> {
    if (isNaN(port) || !isFinite(port)) throw Error(`Invalid port ${port}`);
    if (port > this.maxPortNumber) throw Error(`Port ${port} over maxPortNumber ${this.maxPortNumber}`);
    if (port < this.minPortNumber) throw Error(`Port ${port} under minPortNumber ${this.minPortNumber}`);

    await this.setPort(port);
  }

  public async sshPortGet(): Promise<number> {
    return await this.getPort();
  }
}

const sshManager = new SshManager({ shellHost });

// CALLS

export async function sshPortSet({ port }: { port: number }): Promise<void> {
  return await sshManager.sshPortSet({ port });
}

export async function sshPortGet(): Promise<number> {
  return await sshManager.sshPortGet();
}

export async function sshStatusSet({ status }: { status: "enabled" | "disabled" }): Promise<void> {
  return await sshManager.sshStatusSet({ status });
}

export async function sshStatusGet(): Promise<ShhStatus> {
  return await sshManager.sshStatusGet();
}
