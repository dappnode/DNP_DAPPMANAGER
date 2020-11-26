import express from "express";
import { pick } from "lodash";
import { listPackage } from "../../modules/docker/listContainers";
import { readManifestIfExists } from "../../modules/manifest";

/**
 * Query publicly available packages data
 */
export const packageManifest: express.Handler = async (req, res) => {
  const dnpName = req.params.dnpName as string | undefined;
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
};
