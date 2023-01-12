import { PackageRequest } from "../../types";

export class DappGetError extends Error {}

export class ErrorDappGetNotSatisfyRange extends DappGetError {
  req: PackageRequest;

  constructor(req: PackageRequest) {
    super(
      `Aggregated versions of request ${req.name}@${req.ver} did not satisfy its range`
    );
    this.req = req;
  }
}

export class ErrorDappGetDowngrade extends DappGetError {
  dnpName: string;
  dnpVersion: string;

  constructor({
    dnpName,
    dnpVersion
  }: {
    dnpName: string;
    dnpVersion: string;
  }) {
    super(
      `Aggregated versions of installed package ${dnpName} cause a downgrade from ${dnpVersion}. Having a future development version could be the cause of this error.`
    );
    this.dnpName = dnpName;
    this.dnpVersion = dnpVersion;
  }
}

export class ErrorDappGetNoVersions extends DappGetError {
  dnpName: string;
  req: PackageRequest;

  constructor({ dnpName, req }: { dnpName: string; req: PackageRequest }) {
    super(
      `No version aggregated for ${dnpName}, request ${req.name} @ ${req.ver}`
    );
    this.dnpName = dnpName;
    this.req = req;
  }
}
