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

  // Prefer the installed package URL. It points to the locally downloaded
  // avatar and carries the current avatar reference as a cache-busting version.
  // Keep the manifest URL as a fallback for old or temporarily stopped packages.
  try {
    const installedAvatarUrl = (await listPackage({ dnpName })).avatarUrl;
    if (installedAvatarUrl) manifest.avatarUrl = installedAvatarUrl;
  } catch {
    // The persisted manifest is still useful when Docker package data is unavailable.
  }

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
