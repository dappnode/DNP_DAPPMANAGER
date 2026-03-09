import { params } from "@dappnode/params";

export async function disableHostScriptsGet(): Promise<boolean> {
  return params.DISABLE_HOST_SCRIPTS;
}
