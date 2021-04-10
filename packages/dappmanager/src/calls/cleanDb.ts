import { clearMainDb } from "../db";

/**
 * Cleans the database content
 */
export async function cleanDb(): Promise<void> {
  clearMainDb();
}
