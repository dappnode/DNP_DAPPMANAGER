import { Dependencies, ChainDriver } from "@dappnode/common";

export interface ContainerLabelsRaw {
  [labelId: string]: string;
}

/**
 * Type mapping of a package container labels
 * NOTE: Treat as unsafe input, labels may not exist or have wrong formatting
 */

export interface ContainerLabelTypes {
  "dappnode.dnp.dnpName": string;
  "dappnode.dnp.version": string;
  "dappnode.dnp.serviceName": string;
  "dappnode.dnp.instanceName": string;
  "dappnode.dnp.dependencies": Dependencies;
  "dappnode.dnp.avatar": string;
  "dappnode.dnp.origin": string;
  "dappnode.dnp.chain": ChainDriver;
  "dappnode.dnp.isCore": boolean;
  "dappnode.dnp.isMain": boolean;
  "dappnode.dnp.dockerTimeout": number;
  "dappnode.dnp.default.environment": string[];
  "dappnode.dnp.default.ports": string[];
  "dappnode.dnp.default.volumes": string[];
}
