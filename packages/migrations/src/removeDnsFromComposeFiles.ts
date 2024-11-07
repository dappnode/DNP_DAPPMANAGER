import { listPackages } from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { logs } from "@dappnode/logger";

/**
 * Migration to allow removal of current Bind functionality
 *
 * DNS resolution should be handled by the Docker DNS, not by Bind package
 *
 * For every service in every compose file, we must make sure it does not include
 * the dns configuration
 */
export async function removeDnsFromComposeFiles(): Promise<void> {
  const packages = await listPackages();

  for (const pkg of packages) {
    removeDnsFromPackageComposeFile(pkg.dnpName, pkg.isCore);
  }
}

export function removeDnsFromPackageComposeFile(dnpName: string, isCore: boolean): void {
  const compose = new ComposeFileEditor(dnpName, isCore);
  const services = compose.services();

  for (const serviceName of Object.keys(services)) {
    const composeService = services[serviceName].get();
    if (composeService.dns) {
      logs.info(`Removing DNS from ${serviceName} in ${dnpName} compose file`);
      // setting undefined a yaml property might result into an error afterwards making js-yaml
      // adding the following value to the undefined `Error parsing YAML: unknown tag !<tag:yaml.org,2002:js/undefined>`
      delete composeService.dns;
      compose.write();
    }
  }
}
