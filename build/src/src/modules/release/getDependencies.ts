import getRelease from "./getRelease";
import { Dependencies } from "../../types";

export default async function getDependencies(
  name: string,
  version?: string
): Promise<Dependencies> {
  const { metadata } = await getRelease(name, version);
  return metadata.dependencies || {};
}
