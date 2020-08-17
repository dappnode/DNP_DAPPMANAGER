import fs from "fs";
import path from "path";
import {
  mapValues,
  omitBy,
  isObject,
  isEmpty,
  pick,
  pull,
  uniq,
  concat
} from "lodash";
import * as getPath from "../../utils/getPath";
import {
  Compose,
  ComposeService,
  PortMapping,
  PackageEnvs,
  ContainerLabels
} from "../../types";
import {
  stringifyPortMappings,
  parsePortMappings,
  mergePortMappings
} from "./ports";
import {
  parseEnvironment,
  mergeEnvs,
  stringifyEnvironment
} from "./environment";
import { verifyCompose } from "./verify";
import { UserSettingsAllDnps } from "../../common";
import { parseUserSettings, applyUserSettings } from "./userSettings";
import { isNotFoundError } from "../../utils/node";
import { yamlDump, yamlParse } from "../../utils/yaml";

class ComposeServiceEditor {
  parent: ComposeEditor;
  serviceName: string;

  constructor(compose: ComposeEditor, serviceName: string) {
    this.parent = compose;
    this.serviceName = serviceName;
  }

  private edit(
    serviceEditor: (service: ComposeService) => Partial<ComposeService>
  ): void {
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
    this.edit(service => ({
      ports: stringifyPortMappings(
        mergePortMappings(
          newPortMappings,
          parsePortMappings(service.ports || [])
        )
      )
    }));
  }

  mergeEnvs(newEnvs: PackageEnvs): void {
    this.edit(service => ({
      environment: stringifyEnvironment(
        mergeEnvs(newEnvs, parseEnvironment(service.environment || []))
      )
    }));
  }

  getEnvs(): PackageEnvs {
    return parseEnvironment(this.get().environment || {});
  }

  addEnvFile(envFile: string): void {
    this.edit(service => ({
      env_file: uniq(concat(service.env_file || [], envFile))
    }));
  }

  /**
   * Remove the legacy .env file added per package
   */
  omitDnpEnvFile(): void {
    this.edit(service => ({
      env_file: pull(service.env_file || [], `${this.serviceName}.env`)
    }));
  }

  mergeLabels(labels: ContainerLabels): void {
    this.edit(service => ({
      labels: { ...service.labels, ...labels }
    }));
  }
}

export class ComposeEditor {
  compose: Compose;

  constructor(compose: Compose) {
    this.compose = compose;
  }

  static readFrom(composePath: string): Compose {
    const yamlString = fs.readFileSync(composePath, "utf8");
    return yamlParse<Compose>(yamlString);
  }

  static getComposePath(dnpName: string, isCore: boolean): string {
    return getPath.dockerCompose(dnpName, isCore);
  }

  service(serviceName?: string): ComposeServiceEditor {
    return new ComposeServiceEditor(
      this,
      serviceName || Object.keys(this.compose.services)[0]
    );
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
    this.compose.services = mapValues(this.compose.services, service => {
      // To be backwards compatible write ENVs as array
      // Previous DAPPMANAGERs cannot in object form, blocking all docker actions + updates
      if (
        typeof service.environment === "object" &&
        !Array.isArray(service.environment)
      )
        service.environment = stringifyEnvironment(service.environment);
      return {
        ...omitBy(service, el => isObject(el) && isEmpty(el)),
        // Add mandatory properties for the ts compiler
        ...pick(service, ["container_name", "image"])
      };
    });

    return this.compose;
  }

  getUserSettings(): UserSettingsAllDnps {
    return parseUserSettings(this.compose);
  }

  applyUserSettings(userSettings: UserSettingsAllDnps): void {
    this.compose = applyUserSettings(this.compose, userSettings);
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
  static getUserSettingsIfExist(
    dnpName: string,
    isCore: boolean
  ): UserSettingsAllDnps {
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
