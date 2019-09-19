import fs from "fs";
import path from "path";
import yaml from "yamljs";
import {
  parsePortMappings,
  stringifyPortMappings,
  mergePortMappings
} from "./dockerComposeParsers";
import { PortMapping } from "../types";
import params from "../params";

interface DockerComposePackage {
  version: string;
  services: {
    [dnpName: string]: {
      container_name: string; // "DAppNodePackage-bitcoin.dnp.dappnode.eth",
      image: string; // "bitcoin.dnp.dappnode.eth:0.1.1";
      volumes: string[]; // ["bitcoin_data:/root/.bitcoin"];
      ports: string[]; // ["8333:8333"];
      env_file: string[]; // ["bitcoin.dnp.dappnode.eth.env"];
      networks: string[]; // ["dncore_network"];
      dns: string; // "172.33.1.2";
      logging: {
        options: {
          "max-size": string; // "10m";
          "max-file": string; // "3";
        };
      };
    };
  };
  volumes: {
    [volumeName: string]: {};
  };
  networks: {
    dncore_network: {
      external: boolean;
    };
  };
}

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

export function readComposeObj(
  dockerComposePath: string
): DockerComposePackage {
  const dcString = fs.readFileSync(dockerComposePath, "utf-8");
  return yaml.parse(dcString);
}

export function writeComposeObj(
  dockerComposePath: string,
  composeObj: DockerComposePackage
): void {
  const composeString = yaml.stringify(composeObj, 8, 2);
  fs.writeFileSync(dockerComposePath, composeString, "utf-8");
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export function getComposeInstance(idOrObject: string | DockerComposePackage) {
  let dockerComposePath = "";
  let composeObj: DockerComposePackage;
  if (typeof idOrObject === "string") {
    dockerComposePath = getDockerComposePath(idOrObject);
    composeObj = readComposeObj(dockerComposePath);
  } else if (typeof idOrObject === "object") {
    composeObj = idOrObject;
  } else {
    throw Error(`Invalid type for idOrObject: ${typeof idOrObject}`);
  }

  const dnpName = Object.getOwnPropertyNames(composeObj.services)[0];
  const service = composeObj.services[dnpName];

  function write(): void {
    composeObj.services[dnpName] = service;
    writeComposeObj(dockerComposePath, composeObj);
  }

  function getPortMappings(): PortMapping[] {
    return parsePortMappings(service.ports || []);
  }

  function mergePortMapping(newPortMappings: PortMapping[]): void {
    service.ports = stringifyPortMappings(
      mergePortMappings(getPortMappings(), newPortMappings)
    );
    write();
  }

  function setPortMappings(newPortMappings: PortMapping[]): void {
    service.ports = stringifyPortMappings(newPortMappings);
    write();
  }

  return {
    getPortMappings,
    mergePortMapping,
    setPortMappings,
    write,
    // Constant getter
    dockerComposePath
  };
}
