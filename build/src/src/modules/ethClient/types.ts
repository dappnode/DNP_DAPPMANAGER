export type EthClientInstallStatus =
  | { status: "TO_INSTALL" }
  | { status: "INSTALLING" }
  | { status: "INSTALLING_ERROR"; error: ErrorSerialized }
  | { status: "INSTALLED" }
  | { status: "UNINSTALLED" };

// type ProviderStatusErrorCode = ProviderStatusError["code"];
// type ProviderStatusErrorMessage = { [key in ProviderStatusErrorCode]: string };

interface ErrorSerialized {
  message: string;
  stack?: string;
}

/**
 * Serialize errors so the can be persisted in the db, a JSON to disk
 * @param e Error
 */
export const serializeError = (e: Error) => ({
  message: e.message,
  stack: e.stack
});
