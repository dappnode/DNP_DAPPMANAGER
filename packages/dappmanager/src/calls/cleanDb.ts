import { clearMainDb } from "../db/index.js";

/**
 * Cleans the database content
 */
export async function cleanDb(): Promise<void> {
  clearMainDb();
}
