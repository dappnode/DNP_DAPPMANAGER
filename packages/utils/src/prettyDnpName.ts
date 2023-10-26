/**
 * Capitalizes a string
 * @param string = "hello world"
 * @returns "Hello world"
 */
function capitalize(s: string): string {
  if (!s || typeof s !== "string") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Pretifies a ENS name
 * "bitcoin.dnp.dappnode.eth" => "Bitcoin"
 * "raiden-testnet.dnp.dappnode.eth" => "Raiden Testnet"
 *
 * @param dnpName ENS name
 * @returns pretty name
 */
export function prettyDnpName(dnpName: string): string {
  if (!dnpName || typeof dnpName !== "string") return dnpName;
  return (
    dnpName
      .split(".")[0]
      // Convert all "-" and "_" to spaces
      .replace(new RegExp("-", "g"), " ")
      .replace(new RegExp("_", "g"), " ")
      .split(" ")
      .map(capitalize)
      .join(" ")
  );
}
