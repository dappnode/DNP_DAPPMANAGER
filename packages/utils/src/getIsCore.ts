import { Manifest } from "@dappnode/types";
import { params } from "@dappnode/params";

type Custom = Pick<Manifest, "type" | "name">;

export function getIsCore(manifest: Custom): boolean {
  if (manifest.type) return manifest.type === "dncore";
  return coreDnpNames.includes(manifest.name);
}

const coreDnpNames = [
  params.dappmanagerDnpName,
  params.WIREGUARD_DNP_NAME,
  params.vpnDnpName,
  params.wifiDnpName,
  params.bindDnpName,
  params.ipfsDnpName,
  params.HTTPS_PORTAL_DNPNAME
];
