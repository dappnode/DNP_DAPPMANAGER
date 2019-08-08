function parsePortMappings(portsArray) {
  return portsArray.map(portString => {
    const [portMapping, type = "tcp"] = portString.split("/");
    const [host, container] = portMapping.split(":");
    // HOST:CONTAINER/type, return [HOST, CONTAINER/type]
    if (container) return { host, container, type };
    // CONTAINER/type, return [null, CONTAINER/type]
    else return { container: host, type };
  });
}

function stringifyPortMappings(portMappings) {
  // Stringify ports
  return portMappings.map(({ host, container, type }) => {
    const parsedType = (type || "").toLowerCase() === "udp" ? "/udp" : "";
    return host
      ? // HOST:CONTAINER/type, if HOST
        [host, container].join(":") + parsedType
      : // CONTAINER/type, if no HOST
        container + parsedType;
  });
}
