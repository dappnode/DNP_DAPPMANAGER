import "mocha";
import * as calls from "../src/calls";
import { PackageContainer, ContainerState } from "../src/types";

export async function getDnpFromListPackages(
  id: string
): Promise<PackageContainer | undefined> {
  const dnpList = await calls.packagesGet();
  if (!Array.isArray(dnpList)) throw Error("listPackages must return an array");
  return dnpList.find(e => e.name.includes(id));
}

export async function getDnpState(
  id: string
): Promise<ContainerState | "down"> {
  const dnp = await getDnpFromListPackages(id);
  return dnp ? dnp.state : "down";
}
