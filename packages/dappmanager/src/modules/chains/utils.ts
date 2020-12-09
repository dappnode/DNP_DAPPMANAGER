/**
 * Make sure progress is a valid number, otherwise API typechecking will error since
 * a NaN value may be converted to null
 */
export function safeProgress(progress: number): number | undefined {
  if (typeof progress !== "number" || isNaN(progress) || !isFinite(progress))
    return undefined;
  else return progress;
}

/**
 * Reword expected chain errors
 */
export function parseChainErrors(error: Error): string {
  if (error.message.includes("ECONNREFUSED"))
    return `DAppNode Package stopped or unreachable (connection refused)`;

  if (error.message.includes("Invalid JSON RPC response"))
    return `DAppNode Package stopped or unreachable (invalid response)`;

  return error.message;
}
