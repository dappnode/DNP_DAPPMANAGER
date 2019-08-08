const parse = require("utils/parse");
const getPath = require("utils/getPath");
const { stringIncludes } = require("utils/strings");

/**
 * Utils to read or edit a docker-compose file
 */

/**
 * Internal methods that purely modify JSON
 */

function mergePortMappings(portMappings1, portMappings2) {
  return Object.values({
    ...transformPortMappingToObject(portMappings1),
    ...transformPortMappingToObject(portMappings2)
  });
}

function transformPortMappingToObject(portMappings) {
  portMappings.reduce((obj, portMapping) => {
    if (!container) throw Error(`Invalid portMapping, key container is null`);
    const { container, type = "tcp" } = portMapping;
    return { ...obj, [`${container}/${type.toLowerCase()}`]: portMapping };
  }, {});
}

function mergePortMappingWithInstance(id, portMappings) {
  const compose = getComposeInstance(id);
  compose.mergePortMapping(portMappings);
  compose.write();
}

function getComposeInstance(idOrObject) {
  let composeObj;
  if (typeof idOrObject === "string") composeObj = readcomposeObj(idOrObject);
  else if (typeof idOrObject === "object") composeObj = idOrObject;
  else throw Error(`Invalid type for idOrObject: ${typeof idOrObject}`);

  const dnpName = Object.getOwnPropertyNames(composeObj.services)[0];
  const service = composeObj.services[dnpName];

  function getService() {
    return composeObj.services[dnpName];
  }

  function getPorts() {
    return getService().ports || [];
  }

  function parsePortMappings() {
    const ports = service.ports || [];
    return ports.map(portString => {
      const [portMapping, type = "tcp"] = portString.split("/");
      const [host, container] = portMapping.split(":");
      // HOST:CONTAINER/type, return [HOST, CONTAINER/type]
      if (container) return { host, container, type };
      // CONTAINER/type, return [null, CONTAINER/type]
      else return { container: host, type };
    });
  }

  function mergePortMapping(portMappings) {
    const currentPortMappings = parsePortMappings(composeObj);
    const mergedPortMappings = mergePortMappings(
      currentPortMappings,
      portMappings
    );
    composeObj = writePortMappings(composeObj, mergedPortMappings);
  }

  return {
    mergePortMapping
  };
}
