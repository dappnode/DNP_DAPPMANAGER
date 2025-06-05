import { pick } from "lodash-es";
import { readManifestIfExists } from "@dappnode/utils";
import { wrapHandler } from "../utils.js";
import { listPackage } from "@dappnode/dockerapi";
interface Params {
  dnpName: string;
}

/**
 * Query publicly available packages data
 */
export const packageManifest = wrapHandler<Params>(async (req, res) => {
  const { dnpName } = req.params;
  if (!dnpName) throw Error(`Must provide containerName`);

  const manifest = readManifestIfExists(dnpName);
  if (!manifest) return res.status(404).send("Manifest not found");

  // This is a temporary fix to get the avatarUrl from the package list
  // Intaller now sets avatarUrl in the manifest. See `dappnodeInstaller` > `joinFilesInManifest`
  // TODO: This setter should be removed once users have updated their packages
  if(!manifest.avatarUrl) 
    manifest.avatarUrl = (await listPackage({dnpName})).avatarUrl
  

  // Filter manifest manually to not send new private properties
  const filteredManifest = pick(manifest, [
    "name",
    "version",
    "upstream",
    "upstreamVersion",
    "shortDescription",
    "description",
    "type",
    "chain",
    "dependencies",
    "mainService",
    "architectures",
    "requirements",
    "globalEnvs",
    "backup",
    "changelog",
    "warnings",
    "updateAlerts",
    "disclaimer",
    "gettingStarted",
    "style",
    "setupWizard",
    "setupSchema",
    "setupTarget",
    "setupUiJson",
    "grafanaDashboards",
    "prometheusTargets",
    "author",
    "contributors",
    "categories",
    "keywords",
    "links",
    "repository",
    "bugs",
    "license",
    "notifications",
    "avatarUrl"
  ]);

  res.status(200).send(filteredManifest);
  return;
});
