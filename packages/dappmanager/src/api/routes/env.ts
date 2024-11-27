import { wrapHandler } from "../utils.js";
import { ComposeFileEditor } from "@dappnode/dockercompose";

interface Params {
  dnpName: string;
  envName: string;
}

/**
 * Query env from a package
 */
export const env = wrapHandler<Params>(async (req, res) => {
  const { dnpName } = req.params;
  const { envName } = req.query;

  if (!dnpName) {
    res.status(400).send();
    return;
  }

  const compose = new ComposeFileEditor(dnpName, false);

  // return all envs if no envName is provided
  if (!envName) {
    res.json(compose.getUserSettings().environment);
    return;
  }

  if (typeof envName !== "string") {
    res.status(400).send("envName must be a string");
    return;
  }

  const environment = compose.getUserSettings().environment;
  for (const serviceName in environment) {
    if (environment[serviceName][envName]) {
      res.json(environment[serviceName][envName]);
      return;
    }
  }

  res.status(404).send();
});
