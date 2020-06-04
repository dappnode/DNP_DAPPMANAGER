import { capitalize, stringEndsWith } from "utils/strings";
import { stringSplit } from "./strings";
import prettyBytesLib from "pretty-bytes";
import { VolumeData } from "types";

export function shortName(ens: string) {
  if (!ens || typeof ens !== "string") return ens;
  if (!ens.includes(".")) return ens;
  return stringSplit(ens, ".")[0];
}

/**
 * Pretifies a ENS name
 * "bitcoin.dnp.dappnode.eth" => "Bitcoin"
 * "raiden-testnet.dnp.dappnode.eth" => "Raiden Testnet"
 *
 * @param {string} name ENS name
 * @returns {string} pretty name
 */
export function shortNameCapitalized(name: string) {
  if (!name || typeof name !== "string") return name;
  let _name = shortName(name)
    // Convert all "-" and "_" to spaces
    .replace(new RegExp("-", "g"), " ")
    .replace(new RegExp("_", "g"), " ")
    .split(" ")
    .map(capitalize)
    .join(" ");

  return _name.charAt(0).toUpperCase() + _name.slice(1);
}

export function shortAuthor(author: string) {
  if (!author || typeof author !== "string") return author;
  const beforeParentesis = stringSplit(author, "(")[0];
  const beforeLessthan = stringSplit(beforeParentesis, "<")[0];
  return beforeLessthan;
}

/**
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @returns {bool} isVerified
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
 * @param {string} volName "dncore_gethdnpdappnodeeth_data"
 * @param {string} dnpName "geth-user.dnp.dappnode.eth"
 * @return res = { name: "Data", "owner": "Geth User" }
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
 * Tries to make a docker volume owner string prettier
 * @param ownerDisplay "nginxproxydnpdappnodeeth"
 * @return "Nginxproxy"
 */
function prettyVolumeOwnerDisplay(ownerDisplay: string): string {
  return shortNameCapitalized(
    ownerDisplay.replace(/dnpdappnodeeth|publicdappnodeeth/, "")
  );
}

/**
 * Helper for VolumesGrid to get a pretty volume name from its volumeData
 * @return "Data", "Identity data"
 */
export function getPrettyVolumeName(volData: VolumeData): string {
  if (volData.nameDisplay) return capitalize(volData.nameDisplay);
  return prettyVolumeName(volData.name, volData.owner).name;
}

/**
 * Helper for VolumesGrid to get a pretty volume owner from its volumeData
 * @return "Geth"
 */
export function getPrettyVolumeOwner(volData: VolumeData): string | undefined {
  return volData.owner
    ? shortNameCapitalized(volData.owner)
    : prettyVolumeName(volData.name).owner ||
        prettyVolumeOwnerDisplay(volData.ownerDisplay || "") ||
        undefined;
}

/**
 * Returns human readable bytes
 * @param {number} bytes 32616256172
 * @return {string} "32GB"
 */
export function prettyBytes(bytes: number) {
  if (typeof bytes === "number") return prettyBytesLib(bytes || 0);
  else return bytes;
}
