import {
  parsePortMappings,
  stringifyPortMappings,
  mergePortMappings,
  PortMapping
} from "./dockerComposeParsers";
import fs from "fs";
import path from "path";
import yaml from "yamljs";
const params = require("params");

interface Service {
  ports: string[];
}

interface ComposeObj {
  services: {
    [dnpName: string]: Service;
  };
}

/**
 * Utils to read or edit a docker-compose file
 */

export function getDockerComposePath(id: string, newFile?: boolean) {
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

function readComposeObj(dockerComposePath: string) {
  const dcString = fs.readFileSync(dockerComposePath, "utf-8");
  return yaml.parse(dcString);
}

function writeComposeObj(dockerComposePath: string, composeObj: ComposeObj) {
  const composeString = yaml.stringify(composeObj, 8, 2);
  fs.writeFileSync(dockerComposePath, composeString, "utf-8");
}

export function getComposeInstance(idOrObject: string | ComposeObj) {
  let dockerComposePath: string = "";
  let composeObj: ComposeObj;
  if (typeof idOrObject === "string") {
    dockerComposePath = getDockerComposePath(idOrObject);
    composeObj = readComposeObj(dockerComposePath);
  } else if (typeof idOrObject === "object") {
    composeObj = idOrObject;
  } else {
    throw Error(`Invalid type for idOrObject: ${typeof idOrObject}`);
  }

  const dnpName = Object.getOwnPropertyNames(composeObj.services)[0];
  const service: Service = composeObj.services[dnpName];

  function write() {
    composeObj.services[dnpName] = service;
    writeComposeObj(dockerComposePath, composeObj);
  }

  function getPortMappings() {
    return parsePortMappings(service.ports || []);
  }

  function mergePortMapping(newPortMappings: PortMapping[]) {
    service.ports = stringifyPortMappings(
      mergePortMappings(getPortMappings(), newPortMappings)
    );
    write();
  }

  return {
    getPortMappings,
    mergePortMapping,
    write,
    // Constant getter
    dockerComposePath
  };
}
