import { Dependencies, ChainDriver, ContainerLabels } from "../../types";
import { parseEnvironment } from "./environment";
import { ComposeService } from "../../common";

/**
 * This module ensures that data stored in a DNP's container labels
 * are stored and retrieved ensuring that the label is correct and
 * the types are the same
 */

const prefix = "dappnode.dnp.";
const defaultEnvironmentId = prefix + "default.environment";
const defaultPortsId = prefix + "default.ports";
const defaultVolumesId = prefix + "default.volumes";
const dependenciesId = prefix + "dependencies";
const avatarId = prefix + "avatar";
const originId = prefix + "origin";
const chainId = prefix + "chain";
const isCoreId = prefix + "isCore";

function setJson(data: object | string[]): string {
  return JSON.stringify(data);
}

function getJson<T>(labelData: string): T {
  return JSON.parse(labelData);
}
function safeGetJson<T>(labelData: string): T | null {
  if (!labelData) return null;
  try {
    return getJson<T>(labelData);
  } catch {
    return null;
  }
}
function safeGetArray(labelData: string): string[] | null {
  return safeGetJson<string[]>(labelData);
}

export function writeDefaultsToLabels({
  environment,
  ports,
  volumes
}: Pick<ComposeService, "environment" | "ports" | "volumes">): ContainerLabels {
  const labels: ContainerLabels = {};
  if (environment)
    labels[defaultEnvironmentId] = setJson(parseEnvironment(environment));
  if (ports) labels[defaultPortsId] = setJson(ports);
  if (volumes) labels[defaultVolumesId] = setJson(volumes);
  return labels;
}

export function readDefaultsFromLabels(
  labels: ContainerLabels
): {
  environment: string[] | null;
  ports: string[] | null;
  volumes: string[] | null;
} {
  return {
    environment: safeGetArray(labels[defaultEnvironmentId]),
    ports: safeGetArray(labels[defaultPortsId]),
    volumes: safeGetArray(labels[defaultVolumesId])
  };
}

export function writeMetadataToLabels({
  dependencies,
  avatar,
  chain,
  origin,
  isCore
}: {
  dependencies?: Dependencies;
  avatar?: string;
  chain?: string;
  origin?: string;
  isCore?: boolean;
}): ContainerLabels {
  const labels: ContainerLabels = {};
  if (dependencies) labels[dependenciesId] = setJson(dependencies);
  if (avatar) labels[avatarId] = avatar;
  if (typeof isCore === "boolean") labels[isCoreId] = isCore ? "true" : "false";
  if (chain) labels[chainId] = chain;
  if (origin) labels[originId] = origin;
  return labels;
}

export function readMetadataFromLabels(
  labels: ContainerLabels
): {
  dependencies: Dependencies;
  avatar: string;
  chain: ChainDriver;
  origin?: string;
  isCore: boolean;
} {
  return {
    dependencies: (safeGetJson(labels[dependenciesId]) || {}) as Dependencies,
    avatar: labels[avatarId] || "",
    chain: (labels[chainId] as ChainDriver) || undefined,
    origin: labels[originId] || undefined,
    isCore: labels[isCoreId] === "true" ? true : false
  };
}
