import { dbCache } from "./dbFactory";
import { RegistryNewRepoEvent } from "../types";

const REGISTRY_EVENTS = "registry-events";
const REGISTRY_LAST_FETCHED_BLOCK = "registry-last-fetched-block";

export const registryEvents = dbCache.indexedByKey<
  RegistryNewRepoEvent[],
  string
>({
  rootKey: REGISTRY_EVENTS,
  getKey: id => id
});

export const registryLastFetchedBlock = dbCache.indexedByKey<
  number | null,
  string
>({
  rootKey: REGISTRY_LAST_FETCHED_BLOCK,
  getKey: id => id
});
