import fs from "fs";
import path from "path";
import { mapValues, omitBy, isObject, isEmpty, pick, pull, uniq, concat, omit } from "lodash-es";
import { ContainerLabelsRaw } from "./types.js";
import {
  Manifest,
  Compose,
  ComposeService,
  ComposeNetwork,
  PackageEnvs,
  ComposeServiceNetwork,
  GlobalEnvsPrefixed,
  PortMapping,
  UserSettings,
  ComposeServiceNetworksObj
} from "@dappnode/types";
import { stringifyPortMappings, parsePortMappings, mergePortMappings } from "./ports.js";
import { parseServiceNetworks } from "./networks.js";
import { verifyCompose } from "./verify.js";
import { parseUserSettings, applyUserSettings } from "./userSettings.js";
import {
  getDockerComposePath,
  isNotFoundError,
  yamlDump,
  yamlParse,
  parseEnvironment,
  mergeEnvs,
  stringifyEnvironment
} from "@dappnode/utils";
import { params } from "@dappnode/params";

export class ComposeServiceEditor {
  parent: ComposeEditor;
  serviceName: string;

  constructor(compose: ComposeEditor, serviceName: string) {
    this.parent = compose;
    this.serviceName = serviceName;
  }

  /**
   * Returns the networks object for this service, always as an object
   */
  getNetworks(): ComposeServiceNetworksObj {
    return parseServiceNetworks(this.get().networks || {});
  }

  private getGlobalEnvsFilePath(isCore: boolean): string {
    return isCore ? params.GLOBAL_ENVS_PATH_FOR_CORE : params.GLOBAL_ENVS_PATH_FOR_DNP;
  }

  private edit(serviceEditor: (service: ComposeService) => Partial<ComposeService>): void {
    const service = this.parent.compose.services[this.serviceName];
    this.parent.compose.services[this.serviceName] = {
      ...service,
      ...serviceEditor(service)
    };
  }

  get(): ComposeService {
    return this.parent.compose.services[this.serviceName];
  }

  getPortMappings(): PortMapping[] {
    return parsePortMappings(this.get().ports || []);
  }

  setPortMapping(newPortMappings: PortMapping[]): void {
    this.edit(() => ({
      ports: stringifyPortMappings(newPortMappings)
    }));
  }

  mergePortMapping(newPortMappings: PortMapping[]): void {
    this.edit((service) => ({
      ports: stringifyPortMappings(mergePortMappings(newPortMappings, parsePortMappings(service.ports || [])))
    }));
  }

  mergeEnvs(newEnvs: PackageEnvs): void {
    this.edit((service) => ({
      environment: stringifyEnvironment(mergeEnvs(newEnvs, parseEnvironment(service.environment || [])))
    }));
  }

  /**
   * Remove the property directly from the service.
   */
  removeDns(): void {
    const service = this.get();
    if ("dns" in service) {
      delete service.dns;
    }
  }

  removeNetworkAliases(networkName: string, aliasesToRemove: string[], serviceNetwork: ComposeServiceNetwork): void {
    this.edit((service) => {
      const networks = parseServiceNetworks(service.networks || {});
      // Network and service network aliases must exist
      if (!networks[networkName] || !serviceNetwork.aliases)
        throw Error("Error removing alias: Network or serviceNetwork does not exist");

      const serviceNetworNewAliases = serviceNetwork.aliases.filter((item) => !aliasesToRemove.includes(item));
      const serviceNetworkUpdated = {
        ...serviceNetwork,
        aliases: serviceNetworNewAliases
      };

      return {
        networks: {
          ...networks,
          [networkName]: {
            ...(networks[networkName] || {}),
            ...serviceNetworkUpdated
          }
        }
      };
    });
  }

  addNetworkAliases(networkName: string, newAliases: string[], serviceNetwork: ComposeServiceNetwork): void {
    this.edit((service) => {
      const networks = parseServiceNetworks(service.networks || {});
      // Network and service network aliases must exist
      if (!networks[networkName] || !serviceNetwork)
        throw Error("Error adding alias: Network or serviceNetwork does not exist");
      const aliasesUpdated = uniq([...(serviceNetwork.aliases || []), ...newAliases]);
      const serviceNetworkUpdated = {
        ...serviceNetwork,
        aliases: aliasesUpdated
      };

      return {
        networks: {
          ...networks,
          [networkName]: {
            ...(networks[networkName] || {}),
            ...serviceNetworkUpdated
          }
        }
      };
    });
  }

  getEnvs(): PackageEnvs {
    return parseEnvironment(this.get().environment || {});
  }

  /**
   * Set global envs to the service (with the rpefix _DAPPNODE_GLOBAL_), there might be two types of global envs:
   * 1. Compose with global env file (https://docs.docker.com/compose/environment-variables/#the-env_file-configuration-option): in this case the pkgs only needs to be restarted to make the changes take effect
   * 2. Compose with global envs under environment (https://docs.docker.com/compose/environment-variables/#pass-environment-variables-to-containers): in this case the pkgs needs to be updated and restarted to make the changes take effect
   */
  setGlobalEnvs(
    manifestGlobalEnvs: Manifest["globalEnvs"],
    globalEnvsFromDbPrefixed: GlobalEnvsPrefixed,
    isCore: boolean
  ): void {
    if (!manifestGlobalEnvs) return;
    if (Array.isArray(manifestGlobalEnvs)) {
      // Add the defined global envs to the selected services
      for (const globEnv of manifestGlobalEnvs) {
        if (!globEnv.services.includes(this.serviceName)) continue;
        const globalEnvsFromManifestPrefixed = globEnv.envs.map((env) => `${params.GLOBAL_ENVS_PREFIX}${env}`);

        if (globalEnvsFromManifestPrefixed.some((env) => !(env in globalEnvsFromDbPrefixed)))
          throw Error(
            `Global envs allowed are ${Object.keys(globalEnvsFromDbPrefixed).join(
              ", "
            )}. Got ${globEnv.envs.join(", ")}`
          );

        this.mergeEnvs(pick(globalEnvsFromDbPrefixed, globalEnvsFromManifestPrefixed));
      }
    } else if ((manifestGlobalEnvs || {}).all) {
      // Add global env_file on request
      this.addEnvFile(this.getGlobalEnvsFilePath(isCore));
    }
  }

  addEnvFile(envFile: string): void {
    this.edit((service) => ({
      env_file: uniq(concat(service.env_file || [], envFile))
    }));
  }

  /**
   * Remove the legacy .env file added per package
   */
  omitDnpEnvFile(): void {
    this.edit((service) => ({
      env_file: pull(service.env_file || [], `${this.serviceName}.env`)
    }));
  }

  mergeLabels(labels: ContainerLabelsRaw): void {
    this.edit((service) => ({
      labels: { ...service.labels, ...labels }
    }));
  }

  /**
   * Add a network to a service, makes sure it's defined in the main networks section
   * If the network is not define uses `networkConfig` or defualts to external network
   */
  addNetwork(networkName: string, serviceNetwork?: ComposeServiceNetwork, networkConfig?: ComposeNetwork): void {
    // Add network to service
    this.edit((service) => {
      const networks = parseServiceNetworks(service.networks || {});
      return {
        networks: {
          ...networks,
          [networkName]: {
            ...(networks[networkName] || {}),
            ...(serviceNetwork || {})
          }
        }
      };
    });

    // Make sure the network is declared in the networks section
    if (!this.parent.compose.networks) this.parent.compose.networks = {};
    if (!this.parent.compose.networks[networkName])
      this.parent.compose.networks[networkName] = networkConfig || {
        external: true
      };
  }

  /**
   * Remove a network (if exists) from service
   */
  removeNetwork(networkName: string): void {
    // Remove network from service
    this.edit((service) => {
      const networks = parseServiceNetworks(service.networks || {});
      return { networks: omit(networks, [networkName]) };
    });

    // Remove network from networks section
    if (this.parent.compose.networks) delete this.parent.compose.networks[networkName];
  }
}

export class ComposeEditor {
  compose: Compose;

  constructor(compose: Compose) {
    this.compose = compose;
  }

  static readFrom(composePath: string): Compose {
    const yamlString = fs.readFileSync(composePath, "utf8");
    // Replace problematic tag with a placeholder value such as null
    const yamlStringParsed = yamlString.replace(/!<tag:yaml\.org,2002:js\/undefined>/g, "null");
    return yamlParse<Compose>(yamlStringParsed);
  }

  static getComposePath(dnpName: string, isCore: boolean): string {
    return getDockerComposePath(dnpName, isCore);
  }

  /**
   * Converts an array of network names to an object with empty values
   */
  static convertNetworkArrayToObject(networks: string[]): ComposeServiceNetworksObj {
    return networks.reduce(
      (acc, networkName) => ({
        ...acc,
        [networkName]: {}
      }),
      {}
    );
  }

  firstService(): ComposeServiceEditor {
    const firstServiceName = Object.keys(this.compose.services)[0];
    if (!firstServiceName) throw Error("Compose has no service");
    return new ComposeServiceEditor(this, firstServiceName);
  }

  services(): { [serviceName: string]: ComposeServiceEditor } {
    return mapValues(this.compose.services, (_service, serviceName) => new ComposeServiceEditor(this, serviceName));
  }

  output(): Compose {
    // Last check to verify compose rules
    verifyCompose(this.compose);

    /**
     * Critical step to prevent writing faulty docker-compose.yml files
     * that can kill docker-compose calls.
     * - Removes service first levels keys that are objects or arrays and
     *   are empty (environment, env_files, ports, volumes)
     */
    this.compose.services = mapValues(this.compose.services, (service) => {
      // To be backwards compatible write ENVs as array
      // Previous DAPPMANAGERs cannot in object form, blocking all docker actions + updates
      if (typeof service.environment === "object" && !Array.isArray(service.environment))
        service.environment = stringifyEnvironment(service.environment);

      // Remove hardcoded DNS
      service.dns = undefined;

      return {
        ...omitBy(service, (el) => isObject(el) && isEmpty(el)),
        // Add mandatory properties for the ts compiler
        ...pick(service, ["container_name", "image"])
      };
    });

    return this.compose;
  }

  getUserSettings(): UserSettings {
    return parseUserSettings(this.compose);
  }

  /**
   * Returns compose network
   */
  getComposeNetwork(networkName: string): ComposeNetwork | null {
    return this.compose.networks?.[networkName] ?? null;
  }

  applyUserSettings(userSettings: UserSettings, { dnpName }: { dnpName: string }): void {
    this.compose = applyUserSettings(this.compose, userSettings, { dnpName });
  }

  dump(): string {
    return yamlDump(this.output());
  }

  /**
   * Writes compose to path, makes sure parent exists with `mkdir -p`
   */
  writeTo(composePath: string): void {
    const dirPath = path.parse(composePath).dir;
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(composePath, this.dump());
  }
}

export class ComposeFileEditor extends ComposeEditor {
  composePath: string;
  constructor(dnpName: string, isCore: boolean) {
    const composePath = ComposeEditor.getComposePath(dnpName, isCore);
    super(ComposeEditor.readFrom(composePath));
    this.composePath = composePath;
  }

  /**
   * Reads a local compose file and get user settings if file exists
   * If file does not exist, return empty user settings
   */
  static getUserSettingsIfExist(dnpName: string, isCore: boolean): UserSettings {
    try {
      return new ComposeFileEditor(dnpName, isCore).getUserSettings();
    } catch (e) {
      if (!isNotFoundError(e)) throw e;
      return {};
    }
  }

  /**
   * Writes compose to path, makes sure parent exists with `mkdir -p`
   */
  write(): void {
    this.writeTo(this.composePath);
  }
}
