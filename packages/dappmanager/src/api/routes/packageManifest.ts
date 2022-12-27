import { pick } from "lodash-es";
import { listPackage } from "../../modules/docker/list";
import { readManifestIfExists } from "../../modules/manifest";
import { wrapHandler } from "../utils";

interface Params {
  dnpName: string;
}

/**
 * Query publicly available packages data
 */
export const packageManifest = wrapHandler<Params>(async (req, res) => {
  const { dnpName } = req.params;
  if (!dnpName) throw Error(`Must provide containerName`);

  const dnp = await listPackage({ dnpName });
  const manifest = readManifestIfExists(dnp);
  if (!manifest) {
    res.status(404).send("Manifest not found");
  }

  // Filter manifest manually to not send new private properties
  const filteredManifest = pick(manifest, [
    "name",
    "version",
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
    "license"
  ]);

  res.status(200).send(filteredManifest);
});
