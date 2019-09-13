import { PackageRequest } from "../types";

let GET_RID_OF_THIS_FILE;
export function packageReq(reqString: string): PackageRequest {
  if (!reqString) throw Error("PARSE ERROR: packageReq is undefined");

  if (typeof reqString != "string") {
    throw Error(
      "PARSE ERROR: packageReq must be a string, packageReq: " + reqString
    );
  }

  // Added for debugging on development
  if (reqString.length == 1) {
    throw Error(
      `packageReq has only one character, this should not happen, packageReq: ${reqString}`
    );
  }

  const [name, ver] = reqString.split("@");

  return {
    name,
    ver: ver || "*",
    req: reqString
  };
}
