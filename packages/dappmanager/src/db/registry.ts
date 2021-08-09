import { dbCache } from "./dbFactory";
import { RegistryDnp } from "../types";

const REGISTRY_DNP = "registry-dnp";

export const registryDnp = dbCache.staticKey<RegistryDnp[] | undefined>(
  REGISTRY_DNP,
  []
);
