import { base } from "./base";
import { NotFoundError } from "../types";
import params from "../../../../params";

const adminUiUrl = `http://my.dappnode/`;
const adminUiInstallUrl = `${adminUiUrl}#/installer`;
const adminUiPackagesUrl = `${adminUiUrl}#/packages`;
const ropstenName = "ropsten.dnp.dappnode.eth";
const swarmName = "swarm.dnp.dappnode.eth";

const a = (url: string, text?: string): string =>
  `<a href="${url}">${text || url}</a>`;

export function notFound(e: NotFoundError): string {
  return base(
    "Decentralized website not found",
    `Make sure the ENS domain ${a(e.domain)} exists
    `,
    e
  );
}

export function noEth(e: Error): string {
  return base(
    "Ethereum node not available",
    `Your mainnet ethereum node is not available
    <br />
    ${e.message}`,
    e
  );
}

export function noRopsten(): string {
  return base(
    "Ropsten not installed",
    `Please install the Ropsten DNP (DAppNode package) to resolve .test domains
    <br />
    ${a(`${adminUiInstallUrl}/${ropstenName}`, "Install Ropsten")}`
  );
}

export function noSwarm(e: Error): string {
  return base(
    "Swarm not installed",
    `Please install the Swarm DNP (DAppNode package) to view bzz:// content
    <br />
    ${a(`${adminUiInstallUrl}/${swarmName}`, "Install Swarm")}`,
    e
  );
}

export function noIpfs(e: Error): string {
  return base(
    "IPFS not available",
    `Make sure your IPFS node is available 
    ${a(`${adminUiPackagesUrl}/${params.ipfsDnpName}`, "IPFS status")}`,
    e
  );
}

export function ethSyncing(): string {
  return base(
    "Page Not Available",
    `Please wait until the chain is synced to browse decentralized webs
    <br />
    Go to the ${a(adminUiUrl, "Admin UI")} to check the sync status`
  );
}

export function unknownError(e: Error): string {
  return base("Page Not Available", `Unknown error`, e);
}
