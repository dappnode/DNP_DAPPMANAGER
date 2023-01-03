import "mocha";
import { expect } from "chai";
import { mapValues } from "lodash-es";
import { findEntries } from "../../../../src/modules/release/ipfs/findEntries";
import {
  releaseFilesToDownload,
  DirectoryFiles
} from "../../../../src/modules/release/ipfs/params";
import { IpfsFileResult } from "../../../../src/types";

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
      "signature.json"
    ].map(name => ({
      name,
      path: `Qm-root/${name}`,
      size: name.length,
      hash: `Qm-${name}`
    }));

    const expectedResultWithNameOnly = {
      manifest: "dappnode_package.json",
      compose: "docker-compose.yml",
      setupWizard: "setup-wizard.json",
      setupSchema: undefined,
      setupTarget: undefined,
      setupUiJson: undefined,
      signature: "signature.json",
      disclaimer: "disclaimer.md",
      gettingStarted: "getting-started.md",
      prometheusTargets: "prometheus-targets.json",
      grafanaDashboards: [
        "docker-grafana-dashboard.json",
        "host-grafana-dashboard.json"
      ]
    };

    const result = mapValues(releaseFilesToDownload, (fileConfig, _fileId) => {
      const fileId = _fileId as keyof DirectoryFiles;
      return findEntries(ipfsFiles, fileConfig, fileId);
    });

    const resultWithNameOnly = mapValues(result, entry =>
      Array.isArray(entry) ? entry.map(e => e.name) : entry?.name
    );

    expect(resultWithNameOnly).to.deep.equal(expectedResultWithNameOnly);
  });
});
