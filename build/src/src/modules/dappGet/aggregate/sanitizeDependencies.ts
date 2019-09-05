import { Dependencies } from "../../../types";

// WARNING: manifest's dependencies is an external uncontrolled input, verify

export default function sanitizeDependencies(dependencies: Dependencies) {
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
    if (dependencies[name] === "latest") {
      dependencies[name] = "*";
    }
  });
  return dependencies;
}
