import * as db from "../../db";
import { logs } from "../../logs";
import { initializeAvahiDaemon } from "../../modules/hostScripts/scripts/avahiDaemon";

export async function startAvahiDaemon(): Promise<void> {
  try {
    // avahiPublishCmdShouldNotRun default value: false. Avahi daemon will start by default
    if (db.avahiPublishCmdShouldNotRun.get()) return;
    await initializeAvahiDaemon();
  } catch (e) {
    logs.error("Error on initializing avahi daemon", e);
  }
}
