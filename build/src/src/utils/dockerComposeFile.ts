import fs from "fs";
import path from "path";
import yaml from "yamljs";
import * as composeParser from "./dockerComposeParsers";
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

export function readComposeObj(dockerComposePath: string): Compose {
  const dcString = fs.readFileSync(dockerComposePath, "utf-8");
  return yaml.parse(dcString);
}

export function writeComposeObj(
  dockerComposePath: string,
  composeObj: Compose
): void {
  const composeString = yaml.stringify(composeObj, 8, 2);
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
        [serviceName]: {
          ...service,
          ...serviceEditor(service, newData)
        }
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
    service;
    return {
      ports: composeParser.stringifyPortMappings(newPortMappings)
    };
  }
);
