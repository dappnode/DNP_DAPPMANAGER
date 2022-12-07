import { dbCache } from "./dbFactory";
import { RegistryNewRepoEvent } from "../types";
import { dbKeys } from "./dbUtils";

export const registryEvents = dbCache.indexedByKey<
  RegistryNewRepoEvent[],
  string
>({
  rootKey: dbKeys.REGISTRY_EVENTS,
  getKey: id => id
});

export const registryLastFetchedBlock = dbCache.indexedByKey<
  number | null,
  string
>({
  rootKey: dbKeys.REGISTRY_LAST_FETCHED_BLOCK,
  getKey: id => id
});

export const registryLastProviderBlock = dbCache.staticKey<number | null>(
  dbKeys.REGISTRY_LAST_PROVIDER_BLOCK,
  null
);
