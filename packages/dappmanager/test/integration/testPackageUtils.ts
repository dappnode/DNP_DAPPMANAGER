import "mocha";
import * as calls from "../../src/calls";
import { InstalledPackageData, ContainerState } from "@dappnode/common";

export async function getDnpFromListPackages(
  dnpName: string
): Promise<InstalledPackageData | undefined> {
  const dnpList = await calls.packagesGet();
  if (!Array.isArray(dnpList)) throw Error("listPackages must return an array");
  return dnpList.find(dnp => dnp.dnpName === dnpName);
}

export async function getDnpState(
  dnpName: string,
  serviceName?: string
): Promise<ContainerState | "down"> {
  const dnp = await getDnpFromListPackages(dnpName);
  if (!dnp) return "down";
  const container = dnp.containers.find(
    c => !serviceName || c.serviceName === serviceName
  );
  return container ? container.state : "down";
}
