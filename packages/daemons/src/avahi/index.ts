import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { initializeAvahiDaemon } from "@dappnode/hostscriptsservices";

export async function startAvahiDaemon(): Promise<void> {
  try {
    // avahiPublishCmdShouldNotRun default value: false. Avahi daemon will start by default
    if (db.avahiPublishCmdShouldNotRun.get()) return;
    await initializeAvahiDaemon();
  } catch (e) {
    // avahi daemon is not suitable for many cases such as dappnode running on cloud
    // avoid spamming the console by printing a small error message
    logs.warn(`Error on initializing avahi daemon: ${e.message}`);
  }
}
