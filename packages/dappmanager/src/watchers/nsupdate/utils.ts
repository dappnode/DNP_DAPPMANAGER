import { PackageContainer } from "../../types";
import { isEmpty } from "lodash";

const TTL = 60;
const ethZone = "eth.";
const dappnodeZone = "dappnode.";

interface DomainMap {
  [domain: string]: string; // ip
}

interface PackageContainerWithIp extends PackageContainer {
  ip: string;
}

interface AliasMap {
  [domainAlias: string]: string; // dnpName
}

/**
 * Rules for allowing or forbidding alias requested by the packages
 * @param alias "fullnode"
 * @param dnp Package object
 */
function isAliasAllowed(alias: string, dnp: PackageContainerWithIp): boolean {
  // For now only allow known aliases
  switch (alias) {
    case "fullnode":
      // Only allow "fullnode" if the package declares itself as an ethereum node
      return dnp.chain === "ethereum";
  }
  return false;
}

/**
 * Constructs a nsupdate.txt file contents
 *
 * @param domains [
 *   { domain: "bitcoin.dappnode", ip: "172.33.0.2" },
 *   { domain: "monero.dappnode", ip: "172.33.0.3" }
 * ]
 * @param zone "dappnode."
 * @return nsupdate.txt contents
 *
 * server 172.33.1.2
 * debug yes
 * zone dappnode.
 * update delete bitcoin.dappnode A
 * update add bitcoin.dappnode 60 A 172.33.0.2
 * update delete monero.dappnode A
 * update add monero.dappnode 60 A 172.33.0.3
 * show
 * send
 */
function getNsupdateTxt(
  domains: DomainMap,
  zone: string,
  removeOnly: boolean
): string {
  const nsupdateInstructions = Object.entries(domains)
    .map(([domain, ip]) => {
      const rm = `update delete ${domain} A`;
      const add = `update add ${domain} ${TTL} A ${ip}`;
      return removeOnly ? rm : [rm, add].join("\n");
    })
    .join("\n");

  return `
server 172.33.1.2
debug yes
zone ${zone}
${nsupdateInstructions}
show
send
`.trim();
}

/**
 * - Strip container prefix
 * - Strip "_"
 *
 * @param name "bitcoin.dnp.dappnode.eth"
 * @return "my.bitcoin.dnp.dappnode.eth"
 *
 * name=$(echo $name | sed 's/DAppNodePackage-//g'| tr -d '/_')
 */
export function getMyDotEthdomain(name: string): string {
  return "my." + name.replace(RegExp("_", "g"), "");
}

/**
 * - Strip container prefix
 * - Strip .dappnode, .eth, .dnp
 * - Strip "_"
 *
 * @param name "bitcoin.dnp.dappnode.eth"
 * @return "bitcoin"
 * - "bitcoin.dnp.dappnode.eth" > "bitcoin.dappnode"
 * - "other.public.dappnode.eth" > "other.public.dappnode"
 *
 * name=$(echo $name | sed 's/DAppNodePackage-//g'| sed 's/\.dappnode\.eth//g' |  sed 's/\.dnp//g' | tr -d '/_')
 */
export function getDotDappnodeDomain(name: string): string {
  return (
    name
      .replace(".dappnode", "")
      .replace(".eth", "")
      .replace(".dnp", "")
      .replace(RegExp("_", "g"), "") + ".dappnode"
  );
}

/**
 * Returns an array of nsupdate.txt files ready for nsupdate
 * If no update must happen, it returns an empty array
 *
 * @param dnpList Abstract this call for testability
 * @param ids Only updates this DNP names
 * @param removeOnly Only remove the record
 */
export function getNsupdateTxts({
  dnpList,
  domainAliases,
  ids,
  removeOnly = false
}: {
  dnpList: PackageContainer[];
  domainAliases: AliasMap;
  ids?: string[];
  removeOnly?: boolean;
}): string[] {
  const dnpsToUpdate: PackageContainerWithIp[] = [];
  // `dnp.ip` = Necessary to satisfy the typscript compiler
  for (const dnp of dnpList)
    if (
      dnp.ip &&
      dnp.isDnp &&
      !dnp.isCore &&
      (!ids || !ids.length || ids.includes(dnp.dnpName))
    )
      dnpsToUpdate.push({ ...dnp, ip: dnp.ip });

  if (!dnpsToUpdate.length) return [];

  const eth: DomainMap = {};
  const dappnode: DomainMap = {};

  // Add domains from installed package names
  for (const dnp of dnpsToUpdate) {
    eth[getMyDotEthdomain(dnp.dnpName)] = dnp.ip;
    dappnode[getDotDappnodeDomain(dnp.dnpName)] = dnp.ip;
  }

  // Add dappnode domain alias from installed packages
  for (const dnp of dnpsToUpdate)
    if (dnp.domainAlias)
      for (const alias of dnp.domainAlias)
        if (isAliasAllowed(alias, dnp))
          dappnode[getDotDappnodeDomain(alias)] = dnp.ip;

  // Add .dappnode domain alias from db (such as fullnode.dappnode)
  for (const [alias, dnpName] of Object.entries(domainAliases)) {
    const dnp = dnpsToUpdate.find(dnp => dnpName && dnp.dnpName === dnpName);
    if (dnp) dappnode[getDotDappnodeDomain(alias)] = dnp.ip;
  }

  return (
    [
      { zone: ethZone, domains: eth },
      { zone: dappnodeZone, domains: dappnode }
    ]
      // Only process zones that have domains / entries
      .filter(({ domains }) => !isEmpty(domains))
      // Convert domain maps to nsupdate txts
      .map(({ zone, domains }) => getNsupdateTxt(domains, zone, removeOnly))
  );
}
