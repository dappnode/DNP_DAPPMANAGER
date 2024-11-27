import { wrapHandler } from "../utils.js";
import { ComposeFileEditor } from "@dappnode/dockercompose";

interface Params {
  dnpName: string;
  envName: string;
}

/**
 * Query env from a package
 */
export const envGet = wrapHandler<Params>(async (req, res) => {
  const { dnpName, envName } = req.params;

  if (!dnpName || !envName) {
    res.status(400).send();
    return;
  }

  const compose = new ComposeFileEditor(dnpName, false);

  const environment = compose.getUserSettings().environment;
  for (const serviceName in environment) {
    if (environment[serviceName][envName]) {
      res.json(environment[serviceName][envName]);
      return;
    }
  }

  res.status(404).send();
});
