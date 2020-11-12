import * as ipfs from "../../ipfs";
import { mapValues } from "lodash";
import memoize from "memoizee";
import {
  Manifest,
  Compose,
  SetupTarget,
  SetupWizard,
  SetupSchema,
  SetupUiJson,
  GrafanaDashboard,
  PrometheusTarget
} from "../../../types";
import { validateManifestBasic } from "../../manifest";
import { validateCompose } from "../../compose";
import { yamlParse } from "../../../utils/yaml";
import { releaseFiles } from "../../../params";

const { avatar: _, ...releaseFilesToDownload } = releaseFiles;

type ResolvedFiles = {
  manifest: Manifest;
  compose: Compose;
  setupWizard: SetupWizard;
  setupSchema: SetupSchema;
  setupTarget: SetupTarget;
  setupUiJson: SetupUiJson;
  disclaimer: string;
  gettingStarted: string;
  prometheusTargets: PrometheusTarget[];
  grafanaDashboards: GrafanaDashboard;
};

const validators: {
  [K in keyof Partial<typeof releaseFilesToDownload>]:
    | ((data: ResolvedFiles[K]) => ResolvedFiles[K])
    | null;
} = {
  manifest: validateManifestBasic,
  compose: validateCompose
};

const ipfsCatStringMemoized = memoize(ipfs.catString, {
  promise: true,
  normalizer: ([{ hash }]) => hash
});

export const download: {
  [K in keyof ResolvedFiles]: (file: {
    hash: string;
  }) => Promise<ResolvedFiles[K]>;
} = mapValues(releaseFilesToDownload, (fileConfig, assetId) =>
  downloadAssetFactory(assetId as keyof ResolvedFiles)
);

function downloadAssetFactory(
  assetId: keyof ResolvedFiles
): <T>(file: { hash: string }) => Promise<T> {
  const validate = validators[assetId];
  const maxLength = releaseFiles[assetId]?.maxSize;
  const format = releaseFiles[assetId]?.format || "TEXT";

  return async function downloadAsset<T>(file: { hash: string }): Promise<T> {
    const hash = file.hash;
    const content = await ipfsCatStringMemoized({ hash, maxLength });
    const data: any = parseFile(content, format);
    return validate ? validate(data) : data;
  };
}

type Format = "JSON" | "YAML" | "TEXT";

function parseFile<T>(data: string, format: Format): T {
  switch (format) {
    case "YAML":
      return yamlParse(data);
    case "JSON":
      return jsonParse(data);
    case "TEXT":
      return (data as unknown) as T;
    default:
      throw Error(`Attempting to parse unknown format ${format}`);
  }
}

/**
 * JSON.parse but with a better error message
 */
function jsonParse<T>(jsonString: string): T {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    throw Error(`Error parsing JSON: ${e.message}`);
  }
}
