import { params } from "@dappnode/params";

export function filterContainers(containers: string[]): string[] {
  return containers.filter(
    (c) =>
      c !== params.bindContainerName && c !== params.dappmanagerContainerName
  );
}
