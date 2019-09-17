import { dynamicKeyValidate, joinWithDot, stripDots } from "./lowLevelDb";
import { Manifest, ApmVersion, ComposeUnsafe } from "../types";
import semver from "semver";

const CACHE = "cache";
const CACHE_MANIFEST = `${CACHE}.manifest`;
const CACHE_APM = `${CACHE}.apm`;
const CACHE_COMPOSE = `${CACHE}.compose`;
const CACHE_IPFS = `${CACHE}.ipfs`;

// cache.manifest

const manifestCacheKeyGetter = (hash: string): string =>
  joinWithDot(CACHE_MANIFEST, hash);
const manifestCacheValidate = (hash: string, manifest?: Manifest): boolean => {
  return (
    typeof hash === "string" && (!manifest || typeof manifest === "object")
  );
};

export const manifestCache = dynamicKeyValidate<Manifest, string>(
  manifestCacheKeyGetter,
  manifestCacheValidate
);

// cache.apm

type ApmKeyArg = { name: string; version: string };
const apmCacheKeyGetter = ({ name, version }: ApmKeyArg): string =>
  joinWithDot(CACHE_APM, stripDots(`${name}-${version}`));
const apmCacheValidate = (
  { name, version }: ApmKeyArg,
  apmVersion?: ApmVersion
): boolean =>
  Boolean(
    name &&
      semver.valid(version) &&
      (!apmVersion || apmVersion.version === version)
  );

export const apmCache = dynamicKeyValidate<ApmVersion, ApmKeyArg>(
  apmCacheKeyGetter,
  apmCacheValidate
);

// cache.compose

const composeCacheKeyGetter = (hash: string): string =>
  joinWithDot(CACHE_COMPOSE, hash);
const composeCacheValidate = (
  hash: string,
  compose?: ComposeUnsafe
): boolean => {
  return typeof hash === "string" && (!compose || typeof compose === "object");
};

export const composeCache = dynamicKeyValidate<ComposeUnsafe, string>(
  composeCacheKeyGetter,
  composeCacheValidate
);

// cache.ipfs

const ipfsCacheKeyGetter = (hash: string): string =>
  joinWithDot(CACHE_IPFS, hash);
const ipfsCacheValidate = (hash: string, content?: string): boolean => {
  return typeof hash === "string" && (!content || typeof content === "string");
};

export const ipfsCache = dynamicKeyValidate<string, string>(
  ipfsCacheKeyGetter,
  ipfsCacheValidate
);
