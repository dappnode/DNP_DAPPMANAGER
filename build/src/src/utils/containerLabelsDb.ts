import { Dependencies } from "../types";

interface ContainerLabels {
  [labelId: string]: string;
}

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
const domainAliasId = prefix + "alias.domain";

function setJson(data: object | string[]): string {
  return JSON.stringify(data);
}

function getJson(labelData: string): object | string[] {
  return JSON.parse(labelData);
}
function safeGetJson(labelData: string): object | string[] | null {
  if (!labelData) return null;
  try {
    return getJson(labelData);
  } catch {
    return null;
  }
}
function safeGetArray(labelData: string): string[] {
  return (safeGetJson(labelData) || []) as string[];
}

export function writeDefaultsToLabels({
  defaultEnvironment,
  defaultPorts,
  defaultVolumes
}: {
  defaultEnvironment: string[];
  defaultPorts: string[];
  defaultVolumes: string[];
}): ContainerLabels {
  return {
    [defaultEnvironmentId]: setJson(defaultEnvironment),
    [defaultPortsId]: setJson(defaultPorts),
    [defaultVolumesId]: setJson(defaultVolumes)
  };
}

export function readDefaultsFromLabels(
  labels: ContainerLabels
): {
  defaultEnvironment: string[];
  defaultPorts: string[];
  defaultVolumes: string[];
  hasDefaults: boolean;
} {
  return {
    defaultEnvironment: safeGetArray(labels[defaultEnvironmentId]),
    defaultPorts: safeGetArray(labels[defaultPortsId]),
    defaultVolumes: safeGetArray(labels[defaultVolumesId]),
    // Sanity flag
    hasDefaults: defaultVolumesId in labels
  };
}

export function writeMetadataToLabels({
  dependencies,
  avatar,
  chain,
  origin,
  isCore,
  domainAlias
}: {
  dependencies?: Dependencies;
  avatar?: string;
  chain?: string;
  origin?: string;
  isCore?: boolean;
  domainAlias?: string[];
}): ContainerLabels {
  const labels: ContainerLabels = {};
  if (dependencies) labels[dependenciesId] = setJson(dependencies);
  if (avatar) labels[avatarId] = avatar;
  if (typeof isCore === "boolean") labels[isCoreId] = isCore ? "true" : "false";
  if (chain) labels[chainId] = chain;
  if (origin) labels[originId] = origin;
  if (domainAlias) labels[domainAliasId] = setJson(domainAlias);
  return labels;
}

export function readMetadataFromLabels(
  labels: ContainerLabels
): {
  dependencies: Dependencies;
  avatar: string;
  chain: string;
  origin?: string;
  isCore: boolean;
  domainAlias?: string[];
} {
  return {
    dependencies: (safeGetJson(labels[dependenciesId]) || {}) as Dependencies,
    avatar: labels[avatarId] || "",
    chain: labels[chainId] || "",
    origin: labels[originId] || undefined,
    isCore: labels[isCoreId] === "true" ? true : false,
    domainAlias: labels[domainAliasId]
      ? ((safeGetJson(labels[domainAliasId]) || undefined) as string[])
      : undefined
  };
}
