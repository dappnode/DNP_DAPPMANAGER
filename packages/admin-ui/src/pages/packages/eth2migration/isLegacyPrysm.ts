import {
  prysmDnpName,
  prysmLegacyStableVersion,
  prysmPraterDnpName,
  prysmPraterLegacyStableVersion
} from "./params";
import semver from "semver";

/**
 * Check if the given dnp is prysm | prysm-prater
 * and if it is a legacy version (previous to web3signer)
 */
export function isLegacyPrysm({
  dnpName,
  version
}: {
  dnpName: string;
  version: string;
}): boolean {
  return (
    (dnpName === prysmDnpName &&
      semver.lte(version, prysmLegacyStableVersion)) ||
    (dnpName === prysmPraterDnpName &&
      semver.lte(version, prysmPraterLegacyStableVersion))
  );
}
