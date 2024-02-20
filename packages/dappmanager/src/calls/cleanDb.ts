import { clearMainDb } from "@dappnode/db";

/**
 * Cleans the database content
 */
export async function cleanDb(): Promise<void> {
  clearMainDb();
}
