import { indexedByKey } from "./dbCache";
import { Manifest, ApmVersion, Compose } from "../types";
import semver from "semver";

const CACHE = "cache";
const CACHE_MANIFEST = `${CACHE}.manifest`;
const CACHE_APM = `${CACHE}.apm`;
const CACHE_COMPOSE = `${CACHE}.compose`;
const CACHE_IPFS = `${CACHE}.ipfs`;

// cache.manifest

export const manifestCache = indexedByKey<Manifest, string>({
  rootKey: CACHE_MANIFEST,
  getKey: hash => hash,
  validate: (hash: string, manifest?: Manifest) =>
    typeof hash === "string" && (!manifest || typeof manifest === "object")
});

// cache.apm

type ApmKeyArg = { name: string; version: string };
export const apmCache = indexedByKey<ApmVersion, ApmKeyArg>({
  rootKey: CACHE_APM,
  getKey: ({ name, version }) => `${name}-${version}`,
  validate: ({ name, version }, apmVersion) =>
    Boolean(
      name &&
        semver.valid(version) &&
        (!apmVersion || apmVersion.version === version)
    )
});

// cache.compose

export const composeCache = indexedByKey<Compose, string>({
  rootKey: CACHE_COMPOSE,
  getKey: hash => hash,
  validate: (hash, compose) =>
    typeof hash === "string" && (!compose || typeof compose === "object")
});

// cache.ipfs

export const ipfsCache = indexedByKey<string, string>({
  rootKey: CACHE_IPFS,
  getKey: hash => hash,
  validate: (hash, content) =>
    typeof hash === "string" && (!content || typeof content === "string")
});
