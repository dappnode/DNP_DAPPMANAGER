/**
 * Checks if the given string is a DNP domain
 * @param id "dnpName.dnp.dappnode.eth"
 */
export default function isDnpDomain(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  if (!id.includes(".")) return false;
  const [, dnpTag, , extension] = id.split(".");
  return Boolean(
    dnpTag &&
      (dnpTag === "dnp" || dnpTag === "public") &&
      extension &&
      extension === "eth"
  );
}
