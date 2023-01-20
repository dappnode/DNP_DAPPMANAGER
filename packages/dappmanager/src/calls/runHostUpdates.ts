import { hostUpdate } from "../modules/hostScripts/scripts/hostUpdate.js";

export async function runHostUpdates(): Promise<string> {
  try {
    return await hostUpdate();
  } catch (e) {
    e.message = `Error on host update: ${e.message}`;
    throw e;
  }
}
