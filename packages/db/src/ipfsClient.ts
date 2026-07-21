import { dbFactory, dbMain } from "./dbFactory.js";
import { IpfsClientTarget } from "@dappnode/types";
import { params } from "@dappnode/params";

// User chosen properties
const IPFS_CLIENT_TARGET = "ipfs-client-target";
const IPFS_GATEWAY = "ipfs-gateway";
const IPFS_GATEWAYS = "ipfs-gateways";

export const ipfsClientTarget = dbMain.staticKey<IpfsClientTarget>(IPFS_CLIENT_TARGET, IpfsClientTarget.local);

type Db = ReturnType<typeof dbFactory>;

/**
 * Keep the legacy key readable as an array so databases written by the first
 * failover implementation can be repaired. All normal writes keep it a string.
 */
export function createIpfsGatewayDb(db: Db, defaultGateway: string) {
  const ipfsGateway = db.staticKey<string | string[]>(IPFS_GATEWAY, defaultGateway);
  const ipfsGateways = db.staticKey<string[] | null>(IPFS_GATEWAYS, null);

  function getIpfsGateways(): string[] {
    const gateways = ipfsGateways.get();
    if (Array.isArray(gateways) && gateways.length > 0) return gateways;

    const legacyGateway = ipfsGateway.get();
    return Array.isArray(legacyGateway) ? legacyGateway : [legacyGateway];
  }

  function setIpfsGateways(gateways: string[]): void {
    if (gateways.length === 0) throw Error("At least one IPFS gateway is required");

    ipfsGateways.set(gateways);
    ipfsGateway.set(gateways[0]);
  }

  return { ipfsGateway, ipfsGateways, getIpfsGateways, setIpfsGateways };
}

export const { ipfsGateway, ipfsGateways, getIpfsGateways, setIpfsGateways } = createIpfsGatewayDb(
  dbMain,
  params.IPFS_REMOTE
);
