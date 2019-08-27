import { eventBus, eventBusTag } from "../eventBus";

/**
 * Some remote procedure calls (RPC) need a continuous update.
 * This function call be called at any point of the app and it
 * will emit and event received by the autobahn session in index.js
 * which will be broadcasted to clients.
 *
 * [NOTE]: Params are de-structured to expose them
 * @param {string} id, overall log id (to bundle multiple logs)
 * id = "ln.dnp.dappnode.eth@/ipfs/Qmabcdf"
 * @param {Sting} name, dnpName the log is referring to
 * name = "bitcoin.dnp.dappnode.eth"
 * @param {string} message, log message
 * message = "Downloading 75%"
 */
export default function logUi({
  id,
  name,
  message,
  clear
}: {
  id: string;
  name?: string;
  message?: string;
  clear?: boolean;
}) {
  eventBus.emit(
    eventBusTag.logUi,
    clear ? { id, clear } : { id, name, message }
  );
}
