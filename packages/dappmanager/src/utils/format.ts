/**
 * Capitalizes a string
 * @param {string} string = "hello world"
 * @returns {string} "Hello world"
 */
export function capitalize(s: string): string {
  if (!s || typeof s !== "string") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shortName(ens: string): string {
  if (!ens || typeof ens !== "string") return ens;
  if (!ens.includes(".")) return ens;
  return (ens || "").split(".")[0];
}

/**
 * Pretifies a ENS name
 * "bitcoin.dnp.dappnode.eth" => "Bitcoin"
 * "raiden-testnet.dnp.dappnode.eth" => "Raiden Testnet"
 *
 * @param {string} name ENS name
 * @returns {string} pretty name
 */
export function shortNameCapitalized(name: string): string {
  if (!name || typeof name !== "string") return name;
  const _name = shortName(name)
    // Convert all "-" and "_" to spaces
    .replace(new RegExp("-", "g"), " ")
    .replace(new RegExp("_", "g"), " ")
    .split(" ")
    .map(capitalize)
    .join(" ");

  return _name.charAt(0).toUpperCase() + _name.slice(1);
}

/**
 * Return a globally unique domain friendly short name
 *
 * NOTE: There will be collisions for packages with names:
 * 1. "goerli-geth.public.dappnode.eth"
 * 2. "goerli/geth.public.dappnode.eth"
 * Since both results will be "goerli-geth-public"
 *
 * @param name "goerli-geth.public.dappnode.eth"
 * @returns "goerli-geth-public"
 */
export function shortNameDomain(name: string): string {
  return (
    name
      .replace(".dappnode", "")
      .replace(".eth", "")
      .replace(".dnp", "")
      // Remove all special characters except for "-"
      .replace(/[^a-zA-Z\-]/g, "-")
      // Remove consecutive "-" characters
      .replace(/(\-)\-+/g, "$1")
  );
}
