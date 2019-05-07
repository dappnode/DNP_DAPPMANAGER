const { stringIncludes } = require("utils/strings");

// WARNING: manifest's dependencies is an external uncontrolled input, verify

function sanitizeDependencies(dependencies) {
  if (!dependencies) {
    throw Error("SANITIZE-ERROR: Dependencies is not defined");
  }
  if (typeof dependencies !== "object") {
    throw Error(
      `SANITIZE-ERROR: Dependencies is not an object, dependencies: ${JSON.stringify(
        dependencies
      )}`
    );
  }
  Object.keys(dependencies).forEach(name => {
    if (stringIncludes(dependencies[name], "latest")) {
      dependencies[name] = "*";
    }
  });
  return dependencies;
}

module.exports = sanitizeDependencies;
