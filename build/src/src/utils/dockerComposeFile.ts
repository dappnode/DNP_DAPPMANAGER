import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import * as composeParser from "./dockerComposeParsers";
import { omit, omitBy, isEmpty, isObject } from "lodash";
import { PortMapping, Compose, PackageEnvs, ComposeService } from "../types";
import params from "../params";

/**
 * Utils to read or edit a docker-compose file
 */

export function getDockerComposePath(id: string, newFile?: boolean): string {
  const composeCorePath = path.join(
    params.DNCORE_DIR,
    `docker-compose-${(id || "").split(".")[0]}.yml`
  );
  const dnpPath = path.join(params.REPO_DIR, id, "docker-compose.yml");

  if (fs.existsSync(composeCorePath)) return composeCorePath;
  else if (fs.existsSync(dnpPath)) return dnpPath;
  else if (newFile) return dnpPath;
  else throw Error(`No docker-compose found for ${id}`);
}

export function parseComposeObj(composeString: string): Compose {
  try {
    return yaml.safeLoad(composeString);
  } catch (e) {
    throw Error(`Error parseing compose yaml: ${e.message}`);
  }
}

export function readComposeObj(dockerComposePath: string): Compose {
  const dcString = fs.readFileSync(dockerComposePath, "utf-8");
  return parseComposeObj(dcString);
}

export function writeComposeObj(
  dockerComposePath: string,
  compose: Compose
): void {
  // Clean empty arrays and objects
  const serviceName = composeParser.parseServiceName(compose);
  const cleanCompose = {
    ...compose,
    services: {
      [serviceName]: omitBy(
        compose.services[serviceName],
        el => isObject(el) && isEmpty(el)
      )
    }
  };

  const composeString = yaml.safeDump(cleanCompose);
  fs.writeFileSync(dockerComposePath, composeString, "utf-8");
}

/**
 * Generic / factory functions for compose service items
 * - editor
 * - getter
 * - setter
 */

function getComposeServiceEditor<T>(
  serviceEditor: (service: ComposeService, newData: T) => ComposeService
) {
  return function composeServiceEditor(
    id: string,
    newData: T,
    options?: { isPath: boolean }
  ): void {
    const composePath =
      options && options.isPath ? id : getDockerComposePath(id);
    const compose = readComposeObj(composePath);
    const serviceName = composeParser.parseServiceName(compose);
    const service = compose.services[serviceName];
    writeComposeObj(composePath, {
      ...compose,
      services: {
        [serviceName]: serviceEditor(service, newData)
      }
    });
  };
}

function getComposeServiceGetter<T>(
  serviceGetter: (service: ComposeService) => T
) {
  return function composeServiceEditor(
    id: string,
    options?: { isPath: boolean }
  ): T {
    const composePath =
      options && options.isPath ? id : getDockerComposePath(id);
    const compose = readComposeObj(composePath);
    const serviceName = composeParser.parseServiceName(compose);
    const service = compose.services[serviceName];
    return serviceGetter(service);
  };
}

export const mergeEnvs = getComposeServiceEditor(
  (service: ComposeService, newEnvs: PackageEnvs): ComposeService => {
    return {
      ...service,
      environment: composeParser.stringifyEnvironment({
        ...composeParser.parseEnvironment(service.environment || []),
        ...newEnvs
      })
    };
  }
);

export const mergeEnvsAndOmitEnvFile = getComposeServiceEditor(
  (service: ComposeService, newEnvs: PackageEnvs): ComposeService => {
    return {
      ...omit(service, "env_file"),
      environment: composeParser.stringifyEnvironment({
        ...composeParser.parseEnvironment(service.environment || []),
        ...newEnvs
      })
    };
  }
);

export const mergePortMapping = getComposeServiceEditor(
  (service: ComposeService, newPortMappings: PortMapping[]): ComposeService => {
    return {
      ...service,
      ports: composeParser.stringifyPortMappings(
        composeParser.mergePortMappings(
          newPortMappings,
          composeParser.parsePortMappings(service.ports || [])
        )
      )
    };
  }
);

export const getPortMappings = getComposeServiceGetter(
  (service: ComposeService) =>
    composeParser.parsePortMappings(service.ports || [])
);

export const setPortMapping = getComposeServiceEditor(
  (service: ComposeService, newPortMappings: PortMapping[]): ComposeService => {
    return {
      ...service,
      ports: composeParser.stringifyPortMappings(newPortMappings)
    };
  }
);
