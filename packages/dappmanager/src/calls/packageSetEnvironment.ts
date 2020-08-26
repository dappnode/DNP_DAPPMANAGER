import { UserSettings } from "../types";
import { listPackage } from "../modules/docker/listContainers";
import { ComposeFileEditor } from "../modules/compose/editor";
import * as eventBus from "../eventBus";
import { restartPackage } from "../modules/docker/restartPackage";

/**
 * Updates the .env file of a package. If requested, also re-ups it
 */
export async function packageSetEnvironment({
  dnpName,
  environment
}: {
  dnpName: string;
  environment: Required<UserSettings>["environment"];
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");
  if (!environment) throw Error("kwarg environment must be defined");

  const dnp = await listPackage(dnpName);
  const compose = new ComposeFileEditor(dnp.dnpName, dnp.isCore);
  compose.applyUserSettings({ environment }, { dnpName });
  compose.write();

  await restartPackage({ dnpName, forceRecreate: false });

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
