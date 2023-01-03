import fs from "fs";
import { mapKeys } from "lodash-es";
import * as db from "../db";
import params from "../params";
import { stringifyEnvironment } from "../modules/compose";
import { PackageEnvs } from "@dappnode/dappnodesdk";
import { packageSetEnvironment } from "../calls/packageSetEnvironment";
import { logs } from "../logs";
import { ComposeFileEditor } from "./compose/editor";
import { listContainers } from "./docker/list";

type GlobalEnvsKeys = keyof typeof params.GLOBAL_ENVS;
type GlobalEnvsValues = typeof params.GLOBAL_ENVS[GlobalEnvsKeys];

export type GlobalEnvs = {
  [K in keyof typeof params.GLOBAL_ENVS]: string;
};

// Create type GlobalEnvsPrefixed where the key may be any value from GlobalEnvsValues
export type GlobalEnvsPrefixed = {
  [K in GlobalEnvsValues]: string;
};

export const globalEnvsFilePath = params.GLOBAL_ENVS_PATH;

/**
 * Compute global ENVs from DB values
 */
export function computeGlobalEnvsFromDb<B extends boolean>(
  prefixed: B
): B extends true ? GlobalEnvsPrefixed : GlobalEnvs {
  const prefix = prefixed ? "_DAPPNODE_GLOBAL_" : "";
  return {
    [`${prefix}ACTIVE`]: "true",
    [`${prefix}INTERNAL_IP`]: db.internalIp.get(),
    [`${prefix}STATIC_IP`]: db.staticIp.get(),
    [`${prefix}HOSTNAME`]: db.staticIp.get() || db.domain.get(),
    [`${prefix}UPNP_AVAILABLE`]: db.upnpAvailable.get() ? "true" : "false",
    [`${prefix}NO_NAT_LOOPBACK`]: db.noNatLoopback.get() ? "true" : "false",
    [`${prefix}DOMAIN`]: db.domain.get(),
    [`${prefix}PUBKEY`]: db.dyndnsIdentity.get().publicKey,
    [`${prefix}ADDRESS`]: db.dyndnsIdentity.get().address,
    [`${prefix}PUBLIC_IP`]: db.publicIp.get(),
    [`${prefix}SERVER_NAME`]: db.serverName.get(),
    [`${prefix}CONSENSUS_CLIENT_MAINNET`]: db.consensusClientMainnet.get(),
    [`${prefix}EXECUTION_CLIENT_MAINNET`]: db.executionClientMainnet.get(),
    [`${prefix}MEVBOOST_MAINNET`]: db.mevBoostMainnet.get(),
    [`${prefix}CONSENSUS_CLIENT_GNOSIS`]: db.consensusClientGnosis.get(),
    [`${prefix}EXECUTION_CLIENT_GNOSIS`]: db.executionClientGnosis.get(),
    [`${prefix}MEVBOOST_GNOSIS`]: db.mevBoostGnosis.get(),
    [`${prefix}CONSENSUS_CLIENT_PRATER`]: db.consensusClientPrater.get(),
    [`${prefix}EXECUTION_CLIENT_PRATER`]: db.executionClientPrater.get(),
    [`${prefix}MEVBOOST_PRATER`]: db.mevBoostPrater.get()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/**
 * Find, update and restart all the dappnode packages that contains the given global env.
 *
 * globalEnvs can be used with:
 * 1. Global env file (https://docs.docker.com/compose/environment-variables/#the-env_file-configuration-option): in this case the pkgs only needs to be restarted to make the changes take effect
 * 2. Global envs in environment (https://docs.docker.com/compose/environment-variables/#pass-environment-variables-to-containers): in this case the pkgs needs to be updated and restarted to make the changes take effect
 *
 * TODO: find a proper way to restart pkgs with global envs defined in the env_file (through manifest > globalEnvs = {all: true})
 */
export async function updatePkgsWithGlobalEnvs(
  globalEnvKey: string,
  globEnvValue: string
): Promise<void> {
  const packages = await listContainers();

  const pkgsWithGlobalEnv = packages.filter(
    pkg =>
      pkg.defaultEnvironment &&
      Object.keys(pkg.defaultEnvironment).some(key => key === globalEnvKey)
  );

  if (pkgsWithGlobalEnv.length === 0) return;

  for (const pkg of pkgsWithGlobalEnv) {
    if (pkg.dnpName === params.dappmanagerDnpName) continue;
    if (!pkg.defaultEnvironment) continue;
    const compose = new ComposeFileEditor(pkg.dnpName, pkg.isCore);
    const services = Object.values(compose.services());
    const environmentsByService: { [serviceName: string]: PackageEnvs }[] = [];
    for (const service of services) {
      const serviceEnvs = service.getEnvs();
      if (globalEnvKey in serviceEnvs) {
        environmentsByService.push({
          [pkg.serviceName]: { [globalEnvKey]: globEnvValue }
        });
      }
    }
    if (environmentsByService.length === 0) continue;
    const environmentByService: { [serviceName: string]: PackageEnvs } =
      environmentsByService.reduce((acc, curr) => ({ ...acc, ...curr }), {});

    await packageSetEnvironment({
      dnpName: pkg.dnpName,
      environmentByService
    }).catch(err => {
      logs.error(
        `Error updating ${pkg.dnpName} with global env ${globalEnvKey}=${globEnvValue}`
      );
      logs.error(err);
    });
  }
}

export function getGlobalEnvsFilePath(isCore: boolean): string {
  return isCore
    ? params.GLOBAL_ENVS_PATH_FOR_CORE
    : params.GLOBAL_ENVS_PATH_FOR_DNP;
}

/**
 * Compute global ENVs from DB values and persist it to .env file
 */
export function writeGlobalEnvsToEnvFile(): void {
  writeEnvFile(globalEnvsFilePath, computeGlobalEnvsFromDb(false));
}

/**
 * Create a global ENVs file with only a sanity check value: { ACTIVE: "true" }
 */
export function createGlobalEnvsEnvFile(): void {
  if (!fs.existsSync(globalEnvsFilePath))
    writeEnvFile(globalEnvsFilePath, { ACTIVE: "true" } as GlobalEnvs);
}

/**
 * Write global ENVs in a file with a prefixed named as defined by params.GLOBAL_ENVS
 * Accepts and envs object
 * ```js
 * { HOSTNAME: "85.84.83.82", ... }
 * ```
 * and writes to disk
 * ```js
 * { "_DAPPNODE_GLOBAL_HOSTNAME": "85.84.83.82", ... }
 * ```
 * @param envs =
 */
function writeEnvFile(envPath: string, envs: GlobalEnvs): void {
  const envsWithPrefix = mapKeys(
    envs,
    (_0, key) => params.GLOBAL_ENVS[key as keyof typeof envs]
  );
  const envData = stringifyEnvironment(envsWithPrefix).join("\n");
  fs.writeFileSync(envPath, envData);
}
