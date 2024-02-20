import "mocha";
import { expect } from "chai";
import { mapValues } from "lodash-es";
import { IPFSEntry } from "@dappnode/toolkit";
import {
  releaseFilesToDownload,
  DirectoryFiles,
  FileConfig,
  releaseFiles,
} from "@dappnode/types";

interface IpfsFileResult {
  name: string; // 'avatar.png',
  path: string; // 'QmR7ALYdVQCSfdob9tzE8mvPn3KJk653maMqLeqMo7eeTg/avatar.png',
  size: number; // 9305,
  hash: string; // 'QmRFfqN93JN5hDfqWhxaY6M16dafS6t9qzRCAKzzNT9ved',
}

type IPFSEntryName = Pick<IPFSEntry, "name">;

type ReleaseFiles = typeof releaseFiles;

// Overload to strictly type the return according to the fildId
export function findEntries<
  T extends IPFSEntryName,
  K extends keyof ReleaseFiles
>(
  files: T[],
  config: Omit<FileConfig, "format">,
  fileId: K
): ReleaseFiles[K] extends { multiple: true }
  ? T[]
  : ReleaseFiles[K] extends { required: true }
  ? T
  : T | undefined;

export function findEntries<T extends IPFSEntryName>(
  files: T[],
  config: Omit<FileConfig, "format">,
  fileId: string
): T[] | T | undefined {
  const matches = files.filter((file) => config.regex.test(file.name));

  if (matches.length === 0 && config.required)
    throw Error(`No ${fileId} found`);

  if (config.multiple) {
    return matches;
  } else {
    if (matches.length > 1)
      throw Error(`Multiple possible entries found for ${fileId}`);
    return matches[0];
  }
}

describe("validateTarImage", () => {
  it("Should find all release entries", () => {
    const ipfsFiles: IpfsFileResult[] = [
      "avatar.png",
      "dappnode_package.json",
      "disclaimer.md",
      "docker-compose.yml",
      "getting-started.md",
      "medalla-validator.dnp.dappnode.eth_1.0.16.tar.xz",
      "medalla-validator.dnp.dappnode.eth_1.0.16_linux-amd64.txz",
      "medalla-validator.dnp.dappnode.eth_1.0.16_linux-arm64.txz",
      "docker-grafana-dashboard.json",
      "host-grafana-dashboard.json",
      "prometheus-targets.json",
      "setup-wizard.json",
      "signature.json",
    ].map((name) => ({
      name,
      path: `Qm-root/${name}`,
      size: name.length,
      hash: `Qm-${name}`,
    }));

    const expectedResultWithNameOnly = {
      manifest: "dappnode_package.json",
      compose: "docker-compose.yml",
      setupWizard: "setup-wizard.json",
      signature: "signature.json",
      disclaimer: "disclaimer.md",
      gettingStarted: "getting-started.md",
      prometheusTargets: "prometheus-targets.json",
      grafanaDashboards: [
        "docker-grafana-dashboard.json",
        "host-grafana-dashboard.json",
      ],
    };

    const result = mapValues(releaseFilesToDownload, (fileConfig, _fileId) => {
      const fileId = _fileId as keyof DirectoryFiles;
      return findEntries(ipfsFiles, fileConfig, fileId);
    });

    const resultWithNameOnly = mapValues(result, (entry) =>
      Array.isArray(entry) ? entry.map((e) => e.name) : entry?.name
    );

    expect(resultWithNameOnly).to.deep.equal(expectedResultWithNameOnly);
  });
});
