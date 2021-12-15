import { PackageContainer } from "../../types";
import { packageGet } from "../../calls";
import shell from "../../utils/shell";
import { eth2migrationParams } from "./params";
import { logs } from "../../logs";

// Common utils

export async function checkBackupRequirements({
  dnpName,
  containerName
}: {
  dnpName: string;
  containerName: string;
}): Promise<void> {
  try {
    // Requirements:
    const container = await getPrysmValidatorContainer(dnpName, containerName);

    // Requirements:
    // 1. Container is running
    if (!container.running)
      throw new Error(
        `Prysm validator container not running in package ${dnpName}`
      );

    // 2. Container has walletdir and walletpassword file
    shell(
      `docker exec ${containerName} ls ${eth2migrationParams.keys.walletPasswordFile}`
    )
      .then(() => logs.info("Eth2 migration: wallet password file found"))
      .catch(e => {
        e.message = `Prysm validator container has no passwordFile: ${eth2migrationParams.keys.walletPasswordFile}. ${e.message}`;
        logs.error(e);
        throw e;
      });
  } catch (e) {
    e.message = `Eth2 migration requirements not fullfilled. ${e.message}`;
    logs.error(e);
    throw e;
  }
}

export async function getPrysmValidatorContainer(
  dnpName: string,
  containerName: string
): Promise<PackageContainer> {
  const prysmPackage = await packageGet({
    dnpName
  });

  const prysmValidatorContainer = prysmPackage.containers.find(
    container => container.containerName === containerName
  );

  if (!prysmValidatorContainer)
    throw new Error(
      `Prysm validator container not found in package ${dnpName}`
    );

  return prysmValidatorContainer;
}

// Keys utils

/**
 * Return a string with the public keys comma separated
 * @param validatorAccountsData output from prysm `validator accounts list`
 */
export function parseValidatorAccounts(validatorAccountsData: string): string {
  const validatorAccounts = validatorAccountsData.match(/(0x[0-9a-fA-F]{96})/g);
  if (!validatorAccounts) throw new Error("No validator accounts found");
  return validatorAccounts.join(",");
}
