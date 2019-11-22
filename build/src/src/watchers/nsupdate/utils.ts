import { PackageContainer } from "../../types";

const TTL = 60;

const zones = {
  "eth.": getMyDotEthdomain,
  "dappnode.": getDotDappnodeDomain
};

interface DomainIp {
  domain: string;
  ip: string;
}
interface DnpToUpdate {
  name: string;
  ip: string;
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
  domains: DomainIp[],
  zone: string,
  removeOnly: boolean
): string {
  const nsupdateInstructions = domains
    .map(({ domain, ip }) => {
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
  ids,
  removeOnly = false
}: {
  dnpList: PackageContainer[];
  ids?: string[];
  removeOnly?: boolean;
}): string[] {
  const dnpsToUpdate: DnpToUpdate[] = [];
  // `dnp.ip` = Necessary to satisfy the typscript compiler
  for (const dnp of dnpList)
    if (
      dnp.ip &&
      dnp.isDnp &&
      !dnp.isCore &&
      (!ids || !ids.length || ids.includes(dnp.name))
    )
      dnpsToUpdate.push({ name: dnp.name, ip: dnp.ip });

  if (!dnpsToUpdate.length) return [];

  return Object.entries(zones).map(([zone, getDomain]) =>
    getNsupdateTxt(
      dnpsToUpdate.map(({ name, ip }) => ({ domain: getDomain(name), ip })),
      zone,
      removeOnly
    )
  );
}
