import { dbCache } from "./dbFactory.js";
import { RegistryNewRepoEvent } from "@dappnode/common";

const REGISTRY_EVENTS = "registry-events";
const REGISTRY_LAST_FETCHED_BLOCK = "registry-last-fetched-block";
const REGISTRY_LAST_PROVIDER_BLOCK = "registry-last-block";

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

export const registryLastProviderBlock = dbCache.staticKey<number | null>(
  REGISTRY_LAST_PROVIDER_BLOCK,
  null
);
