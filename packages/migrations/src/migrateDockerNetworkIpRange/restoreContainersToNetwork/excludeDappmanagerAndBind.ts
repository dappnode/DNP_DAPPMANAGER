import { params } from "@dappnode/params";

export function excludeDappmanagerAndBind(containers: string[]): string[] {
  return containers.filter((c) => c !== params.bindContainerName && c !== params.dappmanagerContainerName);
}
