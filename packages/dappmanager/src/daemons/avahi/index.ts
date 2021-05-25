import { spawn } from "child_process";
import AbortController, { AbortSignal } from "abort-controller";
import retry from "async-retry";
import * as db from "../../db";
import params from "../../params";
import { pause } from "../../utils/asyncFlows";
import { logs } from "../../logs";

// variable en db para saber si daemon apagado o no
// para signal utilizar un enum

enum AvahiStatusType {
  started = "started",
  stopped = "stopped"
}

type AvahiStatus =
  | {
      type: AvahiStatusType.started;
      controller: AbortController;
    }
  | {
      type: AvahiStatusType.stopped;
    };

class AvahiController {
  status: AvahiStatus = { type: AvahiStatusType.stopped };

  async start(): Promise<void> {
    if (this.status.type === AvahiStatusType.started) return;

    const controller = new AbortController();
    this.status = { type: AvahiStatusType.started, controller };

    try {
      logs.info("Starting avahi-publish");

      const { internalIp, publicIp } = await waitForIps();

      if (publicIp === internalIp) {
        logs.info(
          "This DAppNode is not behind a router, skipping avahi-publish daemon"
        );
        return;
      }

      // avahi-publish -a -R $MDNS_DOMAIN $IP
      // where -R argument is neccesary only if you want to publish more domains pointing to the same IP
      // It runs in the foreground until it is sent SIGINT (ctrl+c) and during that time all machines
      // on broadcast domain should be able to resolve that domain to the IP
      // See https://github.com/dappnode/DNP_DAPPMANAGER/issues/669

      // > Not necessary to manually SIGINT avahi-publish. DAPPMANAGER does not gracefully shutdown now
      //   so Docker will just kill all processes eventually

      // Broken pipe. If you use pipes or FIFOs, you have to design your application so that one process
      // opens the pipe for reading before another starts writing. If the reading process never starts,
      // or terminates unexpectedly, writing to the pipe or FIFO raises a SIGPIPE signal. If SIGPIPE is blocked,
      // handled or ignored, the offending call fails with EPIPE instead.
      // To dettach the process from the parent: https://stackoverflow.com/questions/25323703/nodejs-execute-command-in-background-and-forget

      await retry(
        bail =>
          new Promise<void>((resolve, reject) => {
            // Using child_process.spawn since it's better for long running processes with unbounded outputs
            // - shell(): Is meant for short processes and features a timeout and buffer limit that we don't want here
            // - child_process.exec: Buffers output, which can cause issues since we want avahi-publish to run for potentially weeks
            const avahi = spawn(
              "avahi-publish",
              ["-a", "-R", params.AVAHI_LOCAL_DOMAIN, internalIp],
              // Pass through the corresponding stdio stream to/from the parent process.
              // In the first three positions, this is equivalent to process.stdin, process.stdout, and process.stderr, respectively
              { stdio: ["inherit", "inherit", "inherit"] }
            );

            avahi.on("close", code => {
              logs.info(`avahi-publish exited with code ${code}`);
              if (code === 0) resolve();
              else reject(Error(`Exit code ${code}`));
            });

            avahi.on("error", err => {
              logs.error("avahi-publish error", err);
              reject(err);
            });

            controller.signal.addEventListener("abort", () => {
              bail(Error("Aborted")); // Prevent more retries
              avahi.kill("SIGINT"); // Gracefully kill spawned process
            });
          }),
        {
          retries: 10,
          maxRetryTime: Infinity,
          maxTimeout: Infinity,
          onRetry: e => logs.error(`Error on avahi-publish`, e)
        }
      );
    } catch (e) {
      logs.error("Too many errors on avahi-publish - stopping daemon", e);
    } finally {
      this.stop();
    }
  }

  stop(): void {
    if (this.status.type === AvahiStatusType.started) {
      this.status.controller.abort();
      this.status = { type: AvahiStatusType.stopped };
    }
  }
}

export const avahiController = new AvahiController();

export async function startAvahiDaemon(signal: AbortSignal): Promise<void> {
  // avahiShouldBeDisabled default value: false. Avahi daemon will start by default
  if (db.avahiShouldBeDisabled.get()) return;
  avahiController.start();

  signal.addEventListener("abort", () => {
    avahiController.stop();
  });
}

/**  Waits for internal IP to be available */
async function waitForIps(): Promise<{ internalIp: string; publicIp: string }> {
  while (true) {
    const internalIp = db.internalIp.get();
    const publicIp = db.publicIp.get();
    if (internalIp && publicIp) return { internalIp, publicIp };
    await pause(1000);
  }
}
