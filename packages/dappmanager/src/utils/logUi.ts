import { eventBus } from "../eventBus";
import { ProgressLog } from "@dappnode/common";
import { logs } from "../logs";

export type Log = (dnpName: string, message: string) => void;

/**
 * Some remote procedure calls (RPC) need a continuous update.
 * This function call be called at any point of the app and it
 * will emit and event received by the autobahn session in index.js
 * which will be broadcasted to clients.
 *
 * [NOTE]: Params are de-structured to expose them
 * @param id, overall log id (to bundle multiple logs)
 * id = "ln.dnp.dappnode.eth@/ipfs/Qmabcdf"
 * @param dnpName, dnpName the log is referring to
 * name = "bitcoin.dnp.dappnode.eth"
 * @param message, log message
 * message = "Downloading 75%"
 */
function logUi(progressLog: ProgressLog): void {
  const { dnpName, message } = progressLog;
  // Log them internally. But skip download progress logs, too spam-y
  if (message && !message.includes("%"))
    logs.info("Progress log", dnpName, message);

  eventBus.logUi.emit(progressLog);
}

export function logUiClear({ id }: { id: string }): void {
  eventBus.logUi.emit({ id, dnpName: "", message: "", clear: true });
}

/**
 * Curried version of logUi to simplify code
 * @param id, overall log id (to bundle multiple logs)
 */
export const getLogUi =
  (id: string): Log =>
  (dnpName: string, message: string): void =>
    logUi({ id, dnpName, message });
