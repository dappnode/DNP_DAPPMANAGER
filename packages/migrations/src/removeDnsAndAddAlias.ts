import { logs } from "@dappnode/logger";
import { ComposeFileEditor, ComposeServiceEditor } from "@dappnode/dockercompose";
import { listPackages } from "@dappnode/dockerapi";

/**
 * DAPPMANAGER updates from <= v0.2.38 must manually add aliases
 * to all running containers.
 * This will run every single time dappmanager restarts and will list al packages
 * and do docker inspect. This migration tries to assure that:
 * Having a package name "example.dnp.dappnode.eth" the aliases should be:
 * "example.dappnode" if the package is mono service
 * "service1.example.dappnode" if the package is multiservice
 * "service1.example.dappnode" and "example.dappnode" if the package is multiservice and has in manifest mainservice
 */
export async function removeDnsAndAddAlias(): Promise<void> {
  const packages = await listPackages();
  for (const pkg of packages) removeDnsFromPackageComposeFile(pkg.dnpName, pkg.isCore);
}

export function removeDnsFromPackageComposeFile(dnpName: string, isCore: boolean): void {
  logs.debug(`Checking DNS from ${dnpName} compose file`);

  const compose = new ComposeFileEditor(dnpName, isCore);
  const services = compose.services();

  for (const serviceName of Object.keys(services)) {
    logs.debug(`Checking DNS from ${serviceName} in ${dnpName} compose file`);
    try {
      const composeServiceEditor = new ComposeServiceEditor(compose, serviceName);
      const composeService = composeServiceEditor.get();

      // check composeService has the key dns
      if ("dns" in composeService) {
        logs.info(`Removing DNS from ${serviceName} in ${dnpName} compose file`);
        // setting undefined a yaml property might result into an error afterwards making js-yaml
        // adding the following value to the undefined `Error parsing YAML: unknown tag !<tag:yaml.org,2002:js/undefined>`
        composeServiceEditor.removeDns();
      }
    } catch (e) {
      logs.error(`Error removing DNS from ${serviceName} in ${dnpName} compose file`, e);
    }
  }
}
