"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const dockerComposeParsers_1 = require("./dockerComposeParsers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yamljs_1 = __importDefault(require("yamljs"));
const params = require("params");
/**
 * Utils to read or edit a docker-compose file
 */
function getDockerComposePath(id) {
  const composeCorePath = path_1.default.join(
    params.DNCORE_DIR,
    `docker-compose-${(id || "").split(".")[0]}.yml`
  );
  const dnpPath = path_1.default.join(
    params.REPO_DIR,
    id,
    "docker-compose.yml"
  );
  if (fs_1.default.existsSync(composeCorePath)) return composeCorePath;
  else if (fs_1.default.existsSync(dnpPath)) return dnpPath;
  else throw Error(`No docker-compose found for ${id}`);
}
function readComposeObj(dockerComposePath) {
  const dcString = fs_1.default.readFileSync(dockerComposePath, "utf-8");
  return yamljs_1.default.parse(dcString);
}
function writeComposeObj(dockerComposePath, composeObj) {
  const composeString = yamljs_1.default.stringify(composeObj, 8, 2);
  fs_1.default.writeFileSync(dockerComposePath, composeString, "utf-8");
}
function getComposeInstance(idOrObject) {
  let dockerComposePath = "";
  let composeObj;
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
  function write() {
    composeObj.services[dnpName] = service;
    writeComposeObj(dockerComposePath, composeObj);
  }
  function getPortMappings() {
    return dockerComposeParsers_1.parsePortMappings(service.ports || []);
  }
  function mergePortMapping(newPortMappings) {
    service.ports = dockerComposeParsers_1.stringifyPortMappings(
      dockerComposeParsers_1.mergePortMappings(
        getPortMappings(),
        newPortMappings
      )
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
exports.getComposeInstance = getComposeInstance;
