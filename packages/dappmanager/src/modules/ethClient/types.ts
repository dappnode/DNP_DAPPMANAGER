import { ErrorSerialized } from "@dappnode/common";

/**
 * Serialize errors so the can be persisted in the db, a JSON to disk
 * @param e Error
 */
export const serializeError = (e: Error): ErrorSerialized => ({
  message: e.message,
  stack: e.stack
});
