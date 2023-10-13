import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { initializeAvahiDaemon } from "@dappnode/hostscripts";

export async function startAvahiDaemon(): Promise<void> {
  try {
    // avahiPublishCmdShouldNotRun default value: false. Avahi daemon will start by default
    if (db.avahiPublishCmdShouldNotRun.get()) return;
    await initializeAvahiDaemon();
  } catch (e) {
    logs.error("Error on initializing avahi daemon", e);
  }
}
