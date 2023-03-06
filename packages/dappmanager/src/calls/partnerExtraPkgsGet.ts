import params from "../params";
import fs from "fs";
import { PartnerExtraPackage } from "@dappnode/common";

export async function partnerExtraPkgsGet(): Promise<PartnerExtraPackage[]> {
  //Read file EXTRA_PKGS_PATH and return the content
  try {
    const extraPackagesFile = fs.readFileSync(params.EXTRA_PKGS_PATH);

    // If the file is empty, return an empty array
    if (extraPackagesFile.length === 0) return [];

    const extraPackages = JSON.parse(
      extraPackagesFile.toString()
    ) as PartnerExtraPackage[];

    // TODO: If the file does not match the PartnerExtraPackages type, throw an error

    // TODO: Add the avatarUrl to the extra packages

    return extraPackages;
  } catch (e) {
    //If the file does not exist, there are no extra packages
    if (e.code === "ENOENT") {
      return [];
    }
    throw e;
  }
}
