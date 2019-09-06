import { PackageEnvs, PackageRequest } from "../types";

export function envFile(envFileData: string): PackageEnvs {
  // Parses key1=value1 files, splited by new line
  //        key2=value2
  return (envFileData || "")
    .trim()
    .split("\n")
    .filter(row => row.length > 0)
    .reduce((obj: PackageEnvs, row: string) => {
      const [key, value] = row.split(/=(.*)/);
      obj[key] = value;
      return obj;
    }, {});
}

export function stringifyEnvs(envs: PackageEnvs): string {
  if (typeof envs === typeof {}) {
    // great
  } else if (typeof envs === typeof "string") {
    throw Error(
      "Attempting to stringify envs of type STRING. Must be an OBJECT: " + envs
    );
  } else {
    throw Error(
      "Attempting to stringify envs of UNKOWN type. Must be an OBJECT: " + envs
    );
  }
  return (
    Object.getOwnPropertyNames(envs)
      // Use join() to prevent "ENV_NAME=undefined"
      .map(envName => [envName, envs[envName] || ""].join("="))
      .join("\n")
      .trim()
  );
}

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
