import { logs } from "@dappnode/logger";
import { DappGetErrors } from "../types.js";

/**
 * Formats an error message
 */
export default function generateErrorMessage({
  hasTimedOut,
  timeoutMs,
  caseId,
  totalCases,
  errors
}: {
  hasTimedOut: boolean;
  timeoutMs: number;
  caseId: number;
  totalCases: number;
  errors: DappGetErrors;
}): string {
  const errorMsgs: string[] = [];
  // Timeout message
  if (hasTimedOut) errorMsgs.push(`Resolver timed out (${timeoutMs} ms).`);
  // Blame message
  try {
    const blameDep: {
      [depKey: string]: number;
    } = {};
    const blameDepReq: {
      [depKey: string]: {
        [reqKey: string]: boolean;
      };
    } = {};
    for (const key of Object.keys(errors)) {
      const [_req, _dep] = key.split("#");
      const req = stripVersion(_req);
      const dep = stripVersion(_dep);
      blameDep[dep] = (blameDep[dep] || 0) + errors[key];
      if (!blameDepReq[dep]) blameDepReq[dep] = {};
      blameDepReq[dep][req] = true;
    }
    const highestDep = Object.keys(blameDep).reduce((a, b) => (blameDep[a] > blameDep[b] ? a : b));
    const blamePackages = Object.keys(blameDepReq[highestDep]).join(", ");
    errorMsgs.push(`Packages ${blamePackages} request incompatible versions of ${highestDep}.`);
  } catch (e) {
    // Ignore possible errors from the message processing
    logs.error("Error generating blame message", e);
  }
  // Report how many cases have been checked
  errorMsgs.push(`Checked ${caseId}/${totalCases} possible states.`);
  // Construct the message
  return errorMsgs.join(" ");
}

function stripVersion(s: string): string {
  if (!s || typeof s !== "string") return s;
  return s.split("@")[0];
}
