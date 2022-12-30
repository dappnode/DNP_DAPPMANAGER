import { capitalize, stringEndsWith } from "utils/strings";
import { stringSplit } from "./strings";
import prettyBytesLib from "pretty-bytes";
import { VolumeData } from "@dappnode/common";

export function prettyFullName({
  dnpName,
  serviceName
}: {
  dnpName: string;
  serviceName: string;
}): string {
  if (dnpName === serviceName) {
    return prettyDnpName(dnpName);
  } else {
    const dnpNamePretty = prettyDnpName(dnpName);
    const serviceNamePretty = prettyDnpName(serviceName);
    if (dnpNamePretty === serviceNamePretty) {
      return dnpNamePretty;
    } else {
      return `${dnpNamePretty} ${serviceNamePretty}`;
    }
  }
}

/**
 * Pretifies a ENS name
 * "bitcoin.dnp.dappnode.eth" => "Bitcoin"
 * "raiden-testnet.dnp.dappnode.eth" => "Raiden Testnet"
 *
 * @param name ENS name
 * @returns pretty name
 */
export function prettyDnpName(dnpName: string) {
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

export function shortAuthor(author: string) {
  if (!author || typeof author !== "string") return author;
  const beforeParentesis = stringSplit(author, "(")[0];
  const beforeLessthan = stringSplit(beforeParentesis, "<")[0];
  return beforeLessthan;
}

/**
 *
 * @param name "bitcoin.dnp.dappnode.eth"
 * @returns isVerified
 */
export function isDnpVerified(name: string) {
  return stringEndsWith(name, "dnp.dappnode.eth");
}

const dnpString = "dnpdappnodeeth_";
const publicString = "publicdappnodeeth_";
const coreString = "dncore_";

/**
 * Formats nicely a docker volume name
 *
 * @param volName "dncore_gethdnpdappnodeeth_data"
 * @param dnpName "geth-user.dnp.dappnode.eth"
 * @returns res = { name: "Data", "owner": "Geth User" }
 */
export function prettyVolumeName(
  volName: string,
  dnpName = ""
): { name: string; owner?: string } {
  if (!volName) return { name: volName };
  if (!dnpName) {
    volName = volName.replace(/^dncore_/, "");

    for (const separator of [dnpString, publicString, "_"]) {
      if (volName.includes(separator)) {
        let [dnpName, prettyVolName] = volName.split(separator);
        if (dnpName === prettyVolName) prettyVolName = "data";
        return { name: capitalize(prettyVolName), owner: capitalize(dnpName) };
      }
    }

    return { name: volName };
  }

  // "nginx-proxy.dnp.dappnode.eth" => "nginxproxydnpdappnodeeth"
  const dnpNameOnVolume = dnpName.replace(/[^0-9a-z]/gi, "");
  if (volName.includes(dnpNameOnVolume)) {
    const prettyVolName = volName.split(`${dnpNameOnVolume}_`)[1];
    return { name: capitalize(prettyVolName) };
  } else if (volName.includes(dnpString) && volName.includes(coreString)) {
    const [leadingString, prettyVolName] = volName.split(dnpString);
    const volOwner = leadingString.split(coreString)[1];
    return { name: capitalize(prettyVolName), owner: capitalize(volOwner) };
  } else {
    return { name: volName };
  }
}

/**
 * Helper for VolumesGrid to get a pretty volume name from its volumeData
 * @returns "Data", "Identity data"
 */
export function getPrettyVolumeName(volData: VolumeData): string {
  if (volData.internalName) return capitalize(volData.internalName);
  return prettyVolumeName(volData.name, volData.owner).name;
}

/**
 * Helper for VolumesGrid to get a pretty volume owner from its volumeData
 * @returns "Geth"
 */
export function getPrettyVolumeOwner(volData: VolumeData): string | undefined {
  return volData.owner
    ? prettyDnpName(volData.owner)
    : prettyVolumeName(volData.name).owner;
}

/**
 * Returns human readable bytes
 * @param bytes 32616256172
 * @returns "32GB"
 */
export function prettyBytes(bytes: number) {
  if (typeof bytes === "number") return prettyBytesLib(bytes || 0);
  else return bytes;
}
