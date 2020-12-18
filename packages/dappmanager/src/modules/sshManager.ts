import { ShhStatus } from "../types";
import { ShellError } from "../utils/shell";

export type ShellHost = (cmd: string) => Promise<string>;

export class SshManager {
  readonly shellHost: ShellHost;

  constructor({ shellHost }: { shellHost: ShellHost }) {
    this.shellHost = shellHost;
  }

  async enable(): Promise<void> {
    // ## Start sshd
    // systemctl start ssh.service
    // systemctl enable ssh.service

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

  async disable(): Promise<void> {
    // ## Stop sshd
    // systemctl stop ssh.service
    // systemctl disable ssh.service

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

  async getStatus(): Promise<ShhStatus> {
    // # Status
    // systemctl status ssh.service
    // systemctl is-enabled ssh.service  # Is sshd enabled at boot time?

    // Sample response if active
    // -------------------------
    // [root@DAppNodeLion:/usr/src/dappnode/DNCORE]# systemctl status ssh.service
    // ● ssh.service - OpenBSD Secure Shell server
    //    Loaded: loaded (/lib/systemd/system/ssh.service; enabled; vendor preset: enabled)
    //    Active: active (running) since Tue 2020-12-08 11:19:33 CET; 13s ago
    //      Docs: man:sshd(8)
    //            man:sshd_config(5)
    //  Main PID: 23896 (sshd)
    //     Tasks: 1 (limit: 4915)
    //    Memory: 1.2M
    //    CGroup: /system.slice/ssh.service
    //            └─23896 /usr/sbin/sshd -D
    //
    // Dec 08 11:19:33 DAppNodeLion systemd[1]: Starting OpenBSD Secure Shell server...
    // Dec 08 11:19:33 DAppNodeLion sshd[23895]: /etc/ssh/sshd_config line 32: Deprecated option UsePrivilegeSeparation
    // Dec 08 11:19:33 DAppNodeLion sshd[23896]: /etc/ssh/sshd_config line 32: Deprecated option UsePrivilegeSeparation
    // Dec 08 11:19:33 DAppNodeLion sshd[23896]: Server listening on 0.0.0.0 port 22.
    // Dec 08 11:19:33 DAppNodeLion sshd[23896]: Server listening on :: port 22.
    // Dec 08 11:19:33 DAppNodeLion systemd[1]: Started OpenBSD Secure Shell server.

    // Sample response if inactive
    // ---------------------------
    // [root@DAppNodeLion:/usr/src/dappnode/DNCORE]# systemctl status ssh.service
    // ● ssh.service - OpenBSD Secure Shell server
    //    Loaded: loaded (/lib/systemd/system/ssh.service; enabled; vendor preset: enabled)
    //    Active: inactive (dead) since Tue 2020-12-08 11:17:56 CET; 40s ago
    //      Docs: man:sshd(8)
    //            man:sshd_config(5)
    //   Process: 498 ExecStartPre=/usr/sbin/sshd -t (code=exited, status=0/SUCCESS)
    //   Process: 514 ExecStart=/usr/sbin/sshd -D $SSHD_OPTS (code=exited, status=0/SUCCESS)
    //  Main PID: 514 (code=exited, status=0/SUCCESS)
    //
    // Dec 08 11:16:34 DAppNodeLion sshd[23597]: rexec line 32: Deprecated option UsePrivilegeSeparation
    // Dec 08 11:16:34 DAppNodeLion sshd[23597]: Connection from 218.92.0.246 port 18318 on 173.249.50.221 port 22
    // Dec 08 11:16:35 DAppNodeLion sshd[23597]: Unable to negotiate with 218.92.0.246 port 18318: no matching key exchange method found. Their offer: diffie-hellman-group1-sha
    // Dec 08 11:16:40 DAppNodeLion sshd[23605]: rexec line 32: Deprecated option UsePrivilegeSeparation
    // Dec 08 11:16:40 DAppNodeLion sshd[23605]: Connection from 114.67.72.164 port 57952 on 173.249.50.221 port 22
    // Dec 08 11:16:40 DAppNodeLion sshd[23605]: Connection closed by 114.67.72.164 port 57952 [preauth]
    // Dec 08 11:17:56 DAppNodeLion systemd[1]: Stopping OpenBSD Secure Shell server...
    // Dec 08 11:17:56 DAppNodeLion sshd[514]: Received signal 15; terminating.
    // Dec 08 11:17:56 DAppNodeLion systemd[1]: ssh.service: Succeeded.
    // Dec 08 11:17:56 DAppNodeLion systemd[1]: Stopped OpenBSD Secure Shell server.

    // is-active PATTERN...
    //     Check whether any of the specified units are active (i.e. running).
    //     Returns an exit code 0 if at least one is active, or non-zero otherwise.
    //     Unless --quiet is specified, this will also print the current unit state to standard output.
    // From https://www.freedesktop.org/software/systemd/man/systemctl.html
    //
    try {
      const statusRes = await this.shellHost("systemctl is-active sshd");
      console.log({ sshStatusOk: statusRes });
      return "enabled";
    } catch (e) {
      if (e instanceof ShellError) {
        console.log({ sshStatusError: e });
        return "disabled";
      } else {
        e.message = `Error getting SSH status: ${e.message}`;
        throw e;
      }
    }
  }

  async changePort(port: number): Promise<void> {
    // ## Change Port
    // export SSH_PORT=2222
    // sed -i "s/.*Port .*/Port $SSH_PORT/g" /etc/ssh/sshd_config
    // systemctl restart ssh.service

    // NOTE: "--" MUST be used to make the flag and the command work
    await this.shellHost(
      `sed -- -i "s/.*Port .*/Port ${port}/g" /etc/ssh/sshd_config`
    );
    await this.shellHost("systemctl restart ssh.service");
  }

  private async removeRootAccess(): Promise<void> {
    // ## Avoid root access
    // sed -i "s/.*PermitRootLogin .*/PermitRootLogin no/g" /etc/ssh/sshd_config

    // NOTE: "--" MUST be used to make the flag and the command work
    await this.shellHost(
      `sed -- -i "s/.*PermitRootLogin .*/PermitRootLogin no/g" /etc/ssh/sshd_config`
    );
  }
}
