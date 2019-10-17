import "mocha";
import * as calls from "../src/calls";
import { PackageContainer, ContainerStatus } from "../src/types";

export async function getDnpFromListPackages(
  id: string
): Promise<PackageContainer | undefined> {
  const res = await calls.listPackages();
  if (!Array.isArray(res.result))
    throw Error("listPackages must return an array");
  return res.result.find(e => e.name.includes(id));
}

export async function getDnpState(
  id: string
): Promise<ContainerStatus | "down"> {
  const dnp = await getDnpFromListPackages(id);
  return dnp ? dnp.state : "down";
}
