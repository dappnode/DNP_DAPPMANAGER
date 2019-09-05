import fs from "fs";
import yaml from "yamljs";
import * as validate from "./validate";
import { parsePortMappings } from "./dockerComposeParsers";
import { Manifest, PackageEnvs, PortMapping } from "../types";

/*
 * Reads and parses files. This util is used to abstract some logic
 * out of other files and ease testing.
 */

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

export function parseDockerCompose(dcString: string): DockerComposePackage {
  return yaml.parse(dcString);
}

export function stringifyDockerCompose(dcObject: DockerComposePackage) {
  return yaml.stringify(dcObject, 9, 2);
}

// Helper function, read and parse docker-compose
export function readDockerCompose(dockerComposePath: string) {
  if (!fs.existsSync(dockerComposePath)) {
    throw Error(`docker-compose does not exist: ${dockerComposePath}`);
  }
  const dcString = fs.readFileSync(dockerComposePath, "utf-8");
  return parseDockerCompose(dcString);
}

export function writeDockerCompose(dockerComposePath: string, dcObject: any) {
  validate.path(dockerComposePath);
  const dcString = stringifyDockerCompose(dcObject);
  fs.writeFileSync(dockerComposePath, dcString, "utf-8");
}

// Select the first service in a docker-compose
function getUniqueDockerComposeService(dockerComposePath: string) {
  const dc = readDockerCompose(dockerComposePath);
  const packageName = Object.keys(dc.services)[0];
  return dc.services[packageName];
}

// Get the volumes of a docker-compose service
export function serviceVolumes(dockerComposePath: string) {
  const dc = readDockerCompose(dockerComposePath);
  const service = getUniqueDockerComposeService(dockerComposePath);

  const externalVolumes = Object.keys(dc.volumes || []);

  const packageVolumes: string[] = [];
  const volumes: string[] = service.volumes || [];
  volumes.map(volume => {
    if (volume.includes(":")) {
      const volumeName = volume.split(":")[0];
      if (externalVolumes.includes(volumeName)) {
        packageVolumes.push(volumeName);
      }
    }
  });
  return packageVolumes;
}

// Get the container name of a docker-compose service
export function containerName(dockerComposePath: string) {
  const service = getUniqueDockerComposeService(dockerComposePath);
  return service.container_name;
}

// Get an array of ports of a docker-compose service
export function dockerComposePorts(dockerComposePath: string): PortMapping[] {
  const service = getUniqueDockerComposeService(dockerComposePath);
  return parsePortMappings(service.ports || []);
}

/**
 * Edit the ports of an existing docker-compose.yml
 * @param {string} dockerComposePath
 * @param {array} dcPorts [
 *   { host: 30444, container: 30303, protocol: "UDP" },
 *   { host: 4000, container: 4000, protocol: "TCP" }
 * ]
 * @returns {object} dcObject, docker-compose.yml json object
 */
export function editDockerComposePorts(
  dockerComposePath: string,
  dcPorts: PortMapping[]
) {
  // Stringify ports
  const stringifiedPorts = dcPorts.map(({ host, container, protocol }) => {
    const parsedType = (protocol || "").toLowerCase() === "udp" ? "/udp" : "";
    return host
      ? // HOST:CONTAINER/type, if HOST
        [host, container].join(":") + parsedType
      : // CONTAINER/type, if no HOST
        container + parsedType;
  });

  const dc = readDockerCompose(dockerComposePath);
  const packageName = Object.keys(dc.services)[0];
  dc.services[packageName].ports = stringifiedPorts;
  return dc;
}

export function envFile(envFileData: string) {
  // Parses key1=value1 files, splited by new line
  //        key2=value2
  return (envFileData || "")
    .trim()
    .split("\n")
    .filter(row => row.length > 0)
    .reduce((obj: PackageEnvs, row: string) => {
      const [key, value] = row.split(/=(.*)/);
      obj[key] = value;
      return obj;
    }, {});
}

export function stringifyEnvs(envs: PackageEnvs) {
  if (typeof envs === typeof {}) {
    // great
  } else if (typeof envs === typeof "string") {
    throw Error(
      "Attempting to stringify envs of type STRING. Must be an OBJECT: " + envs
    );
  } else {
    throw Error(
      "Attempting to stringify envs of UNKOWN type. Must be an OBJECT: " + envs
    );
  }
  return (
    Object.getOwnPropertyNames(envs)
      // Use join() to prevent "ENV_NAME=undefined"
      .map(envName => [envName, envs[envName] || ""].join("="))
      .join("\n")
      .trim()
  );
}

export function packageReq(reqString: string) {
  if (!reqString) throw Error("PARSE ERROR: packageReq is undefined");

  if (typeof reqString != "string") {
    throw Error(
      "PARSE ERROR: packageReq must be a string, packageReq: " + reqString
    );
  }

  // Added for debugging on development
  if (reqString.length == 1) {
    throw Error(
      `packageReq has only one character, this should not happen, packageReq: ${reqString}`
    );
  }

  const [name, ver] = reqString.split("@");

  return {
    name,
    ver: ver || "*",
    req: reqString
  };
}

// A package manifest has this format:
// {
//   ...
//   "dependencies": {
//     "nginx-proxy.dnp.dappnode.eth": "latest"
//   }
// }

export const manifest = {
  depObject: function(manifest: Manifest) {
    const depObject = manifest.dependencies || {};
    if (!depObject || typeof depObject != typeof {}) {
      throw Error(
        `Broken dependency object, of: ${JSON.stringify(
          packageReq
        )} depObject: ${depObject}`
      );
    }
    return depObject;
  },

  imageName: (manifest: Manifest) => manifest.image.path,
  imageHash: (manifest: Manifest) => manifest.image.hash,
  imageSize: (manifest: Manifest) => manifest.image.size,
  type: (manifest: Manifest) => manifest.type,
  version: (manifest: Manifest) => manifest.version
};
