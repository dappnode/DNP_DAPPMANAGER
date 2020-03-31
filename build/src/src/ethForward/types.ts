/**
 * Content locations supported by the ETH FORWARD
 */
export type Location = "ipfs" | "swarm";

/**
 * Network names supported by the ETH FORWARD
 */
export type Network = "mainnet" | "ropsten";

/**
 * Content descriptor
 */
export type Content =
  | {
      location: "ipfs";
      hash: string; // "Qm7700z..."
    }
  | {
      location: "swarm";
      hash: string; // "0x77a7a00...";
    };

/**
 * Custom errors
 */
export type EthForwardErrorCode =
  | "NOTFOUND"
  | "RESOLVERNOTFOUND"
  | "PROXYERROR"
  | "NODENOTAVAILABLE";

export class EthForwardError extends Error {
  code: EthForwardErrorCode;
  constructor(message: string, code: EthForwardErrorCode) {
    super(message);
    this.code = code;
  }
}

/**
 * ENS resolver for a given node not found
 */
export class EnsResolverError extends EthForwardError {
  domain: string;
  constructor(message: string, data: { domain: string }) {
    super(message, "RESOLVERNOTFOUND");
    this.domain = data.domain;
  }
}

/**
 * Generic not found error
 */
export class NotFoundError extends EthForwardError {
  domain: string;
  constructor(message: string, data: { domain: string }) {
    super(message, "NOTFOUND");
    this.domain = data.domain;
  }
}

/**
 * Node hosting the content at location is not available
 */
export class NodeNotAvailable extends EthForwardError {
  location: Location;
  constructor(message: string, location: Location) {
    super(message, "NODENOTAVAILABLE");
    this.location = location;
  }
}

/**
 * Unknown error when proxying
 */
export class ProxyError extends EthForwardError {
  target: string;
  constructor(message: string, target: string) {
    super(message, "PROXYERROR");
    this.target = target;
  }
}
