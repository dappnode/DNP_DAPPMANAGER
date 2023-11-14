import { exec } from "child_process";

/**
 * Calls `nsupdate` and passes the contents of an nsupdate via stdin
 *
 * @param nsupdateTxt nsupdate.txt contents
 *
 * server 172.33.1.2
 * debug yes
 * zone dappnode.
 * update delete bitcoin.dappnode A
 * update add bitcoin.dappnode 60 A 172.33.0.2
 * update delete monero.dappnode A
 * update add monero.dappnode 60 A 172.33.0.3
 * show
 * send
 */
export function execNsupdate(nsupdateTxt: string): Promise<string> {
  return new Promise((resolve, reject): void => {
    const child = exec("nsupdate -v", (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout || stderr);
    });

    if (!child.stdin)
      return reject(Error("Process has no stdin stream available"));

    child.stdin.write(nsupdateTxt);
    child.stdin.end(); // this call seems necessary, at least with plain node.js executable
  });
}
