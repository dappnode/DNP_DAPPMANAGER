const logs = require("../../logs")(module);

// ##### TODO Is this file still necessary?

// Expects:
// arg[0] a stdout string from a docker-compose ps
// arg[1] a string with the packageName: i.e. otpweb.dnp.dappnode.eth
export function containerStateFromPs(
  dockerPsOutput: string,
  containerName: string
) {
  const containers = parsePs(dockerPsOutput);
  const container = containers.find(c => c.name.includes(containerName));
  if (!container) {
    return "Down";
  } else if ("state" in container) {
    return container.state;
  } else {
    return "Unkown";
  }
}

export function parsePs(output = "") {
  const rows = output.split("\n").filter(row => row.replace(/\s/g, "").length);
  // remove row only contained whitespace (ie. spaces, tabs or line breaks)

  const namesRow = rows[0] || "";
  const containerRows = rows.slice(2);

  const propNames = namesRow
    .split("  ")
    .filter(e => e != "")
    .map(e => e.trim().toLowerCase());

  // If the docker-compose ps format changes, this may alert it
  if (propNames.length != 4) {
    logs.warn(`docker-compose ps output must have 4 props: \n${output}`);
  } else if (
    propNames[0] != "name" ||
    propNames[1] != "command" ||
    propNames[2] != "state" ||
    propNames[3] != "ports"
  ) {
    logs.warn(
      `docker-compose ps output headers must be "name, command, state, ports": \n${output}`
    );
  }

  return containerRows
    .filter(row => row.length > 1)
    .map(row => {
      const containerProps = row
        .split("  ")
        .filter(e => e != "")
        .map(e => e.trim());

      const nameCorrected = containerProps[0].replace("DAppNodePackage-", "");

      return {
        name: nameCorrected,
        command: containerProps[1],
        state: containerProps[2],
        ports: containerProps[3] || ""
      };
    });
}
