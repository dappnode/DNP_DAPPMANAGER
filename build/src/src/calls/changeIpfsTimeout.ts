import params from "../params";

/**
 * Used to test different IPFS timeout parameters live from the ADMIN UI.
 * @param {(string|number)} timeout new IPFS timeout in ms
 */
export default async function changeIpfsTimeout({
  timeout
}: {
  timeout?: number;
}) {
  if (!timeout) throw Error("kwarg timeout must be defined");

  params.IPFS_TIMEOUT = timeout;

  return {
    message: `IPFS timeout set to ${timeout}`,
    logMessage: true,
    userAction: true
  };
}
