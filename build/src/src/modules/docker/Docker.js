// node modules
const shell = require("./shell");
const dockerCommands = require("./dockerCommands");
const { mapValues } = require("lodash");

/**
 * Wraps the docker command getters with the shell utility.
 * function up(id) {
 *   return `docker-compose up ${id}`
 * }
 * const docker = wrapCommands({ up })
 * docker = {
 *   up: (id) => shell(up(id))
 * }
 *
 * It does so recursively, because the commands are organized at
 * more than 1 level deep
 * @param {object} obj
 */
function wrapCommands(obj) {
  return mapValues(obj, commandGetter => {
    if (typeof commandGetter === "object") return wrapCommands(commandGetter);
    else
      return function(...args) {
        return shell(commandGetter(...args));
      };
  });
}

module.exports = wrapCommands(dockerCommands);
