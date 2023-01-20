import * as db from "../../db/index.js";
import { logs } from "../../logs.js";
import { initializeAvahiDaemon } from "../../modules/hostScripts/scripts/avahiDaemon.js";

export async function startAvahiDaemon(): Promise<void> {
  try {
    // avahiPublishCmdShouldNotRun default value: false. Avahi daemon will start by default
    if (db.avahiPublishCmdShouldNotRun.get()) return;
    await initializeAvahiDaemon();
  } catch (e) {
    logs.error("Error on initializing avahi daemon", e);
  }
}
