import { ContainerLabelsRaw, ContainerLabelTypes } from "../../types";
import { stringifyEnvironment } from "./environment";
import {
  ComposeService,
  ChainDriver,
  ChainDriverSpecs,
  ChainDriverType,
  chainDriversTypes,
  Dependencies
} from "@dappnode/dappnodesdk";
import { pick, omitBy, mapValues } from "lodash-es";

/**
 * This module ensures that data stored in a DNP's container labels
 * are stored and retrieved ensuring that the label is correct and
 * the types are the same
 */

const parseString = (value: string | undefined): string | undefined => value;
const parseNumber = (value: string | undefined): number | undefined =>
  value === undefined ? undefined : parseInt(value);
const parseBool = (value: string | undefined): boolean | undefined =>
  typeof value === "string" ? (value === "true" ? true : false) : undefined;
const parseJsonSafe = <T>(value: string | undefined): T | undefined => {
  if (value)
    try {
      return JSON.parse(value);
    } catch {}
};

const writeString = (data: string | undefined): string | undefined => data;
const writeNumber = (num: number | undefined): string | undefined =>
  num === undefined ? undefined : String(num);
const writeBool = (data: boolean | undefined): string | undefined =>
  data === true ? "true" : data === false ? "false" : undefined;
const writeJson = (data: Record<string, unknown> | string[]): string =>
  JSON.stringify(data);

const labelParseFns: {
  [K in keyof Required<ContainerLabelTypes>]: (
    labelValue: string | undefined
  ) => ContainerLabelTypes[K] | undefined;
} = {
  "dappnode.dnp.dnpName": parseString,
  "dappnode.dnp.version": parseString,
  "dappnode.dnp.serviceName": parseString,
  "dappnode.dnp.instanceName": parseString,
  "dappnode.dnp.dependencies": value => parseJsonSafe(value) || {},
  "dappnode.dnp.avatar": parseString,
  "dappnode.dnp.origin": parseString,
  "dappnode.dnp.chain": value => {
    if (chainDriversTypes.includes(value as ChainDriverType)) {
      return value as ChainDriverType;
    }
    const valueParsed = parseJsonSafe(value);
    if (
      valueParsed &&
      chainDriversTypes.includes(
        (valueParsed as ChainDriverSpecs).driver as ChainDriverType
      )
    )
      return valueParsed as ChainDriver;
    return undefined;
  },
  "dappnode.dnp.isCore": parseBool,
  "dappnode.dnp.isMain": parseBool,
  "dappnode.dnp.dockerTimeout": parseNumber,
  "dappnode.dnp.default.environment": value => parseJsonSafe(value),
  "dappnode.dnp.default.ports": value => parseJsonSafe(value),
  "dappnode.dnp.default.volumes": value => parseJsonSafe(value)
};

const labelStringifyFns: {
  [K in keyof Required<ContainerLabelTypes>]: (
    data: ContainerLabelTypes[K]
  ) => string | undefined;
} = {
  "dappnode.dnp.dnpName": writeString,
  "dappnode.dnp.version": writeString,
  "dappnode.dnp.serviceName": writeString,
  "dappnode.dnp.instanceName": writeString,
  "dappnode.dnp.dependencies": writeJson,
  "dappnode.dnp.avatar": writeString,
  "dappnode.dnp.origin": writeString,
  "dappnode.dnp.chain": value =>
    value && chainDriversTypes.includes(value as ChainDriverType)
      ? writeString(value as ChainDriverType)
      : writeJson(value as ChainDriverSpecs),
  "dappnode.dnp.isCore": writeBool,
  "dappnode.dnp.isMain": writeBool,
  "dappnode.dnp.dockerTimeout": writeNumber,
  "dappnode.dnp.default.environment": writeJson,
  "dappnode.dnp.default.ports": writeJson,
  "dappnode.dnp.default.volumes": writeJson
};

function parseContainerLabels(
  labelsRaw: ContainerLabelsRaw
): Partial<ContainerLabelTypes> {
  return mapValues(labelParseFns, (labelParseFn, label) =>
    labelParseFn(labelsRaw[label])
  ) as Partial<ContainerLabelTypes>;
}

function stringifyContainerLabels(
  labels: Partial<ContainerLabelTypes>
): ContainerLabelsRaw {
  const labelsRaw = mapValues(
    pick(labelStringifyFns, Object.keys(labels)),
    (labelStringifyFn, label) =>
      (labelStringifyFn as <T>(data: T) => string)(
        labels[label as keyof ContainerLabelTypes]
      )
  ) as ContainerLabelsRaw;
  return omitBy(labelsRaw, value => value === undefined);
}

type ServiceDefaultSettings = Pick<
  ComposeService,
  "environment" | "ports" | "volumes"
>;

export function writeDefaultsToLabels({
  environment,
  ports,
  volumes
}: ServiceDefaultSettings): ContainerLabelsRaw {
  return stringifyContainerLabels({
    "dappnode.dnp.default.environment":
      environment &&
      (Array.isArray(environment)
        ? environment
        : stringifyEnvironment(environment)),
    "dappnode.dnp.default.ports": ports,
    "dappnode.dnp.default.volumes": volumes
  });
}

export function readContainerLabels(labelsRaw: ContainerLabelsRaw): Partial<{
  dnpName: string;
  version: string;
  serviceName: string;
  instanceName: string;
  dependencies: Dependencies;
  avatar: string;
  origin: string;
  chain: ChainDriver;
  isCore: boolean;
  isMain: boolean;
  dockerTimeout: number;
  defaultEnvironment: string[];
  defaultPorts: string[];
  defaultVolumes: string[];
}> {
  const labelValues = parseContainerLabels(labelsRaw);
  return {
    dnpName: labelValues["dappnode.dnp.dnpName"],
    version: labelValues["dappnode.dnp.version"],
    serviceName: labelValues["dappnode.dnp.serviceName"],
    instanceName: labelValues["dappnode.dnp.instanceName"],
    dependencies: labelValues["dappnode.dnp.dependencies"],
    avatar: labelValues["dappnode.dnp.avatar"],
    origin: labelValues["dappnode.dnp.origin"],
    chain: labelValues["dappnode.dnp.chain"],
    isCore: labelValues["dappnode.dnp.isCore"],
    isMain: labelValues["dappnode.dnp.isMain"],
    dockerTimeout: labelValues["dappnode.dnp.dockerTimeout"],
    defaultEnvironment: labelValues["dappnode.dnp.default.environment"],
    defaultPorts: labelValues["dappnode.dnp.default.ports"],
    defaultVolumes: labelValues["dappnode.dnp.default.volumes"]
  };
}

export function writeMetadataToLabels({
  dnpName,
  version,
  serviceName,
  dependencies,
  avatar,
  chain,
  origin,
  isCore,
  isMain,
  dockerTimeout
}: {
  dnpName: string;
  version: string;
  serviceName: string;
  dependencies?: Dependencies;
  avatar?: string;
  chain?: ChainDriver;
  origin?: string;
  isCore?: boolean;
  isMain?: boolean;
  dockerTimeout?: number;
}): ContainerLabelsRaw {
  return stringifyContainerLabels({
    "dappnode.dnp.dnpName": dnpName,
    "dappnode.dnp.version": version,
    "dappnode.dnp.serviceName": serviceName,
    "dappnode.dnp.dependencies": dependencies,
    "dappnode.dnp.avatar": avatar,
    "dappnode.dnp.origin": origin,
    "dappnode.dnp.chain": chain,
    "dappnode.dnp.isCore": isCore,
    "dappnode.dnp.isMain": isMain,
    "dappnode.dnp.dockerTimeout": dockerTimeout
  });
}
