import { securityUpdate } from "../modules/hostScripts/scripts/securityUpdate";

export async function updateSecurity(): Promise<string> {
  try {
    return await securityUpdate();
  } catch (e) {
    e.message = `Error on host security update: ${e.message}`;
    throw e;
  }
}
