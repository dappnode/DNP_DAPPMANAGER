import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { ComposeEditor } from "@dappnode/dockercompose";
import { Compose } from "@dappnode/types";
import { yamlDump, getDockerComposePath, parseEnvironment } from "@dappnode/utils";
import { params } from "@dappnode/params";
import { persistDappmanagerSettings } from "../../../src/installer/getInstallerPackageData.js";

const dnpName = params.dappmanagerDnpName;
const isCore = true;

/**
 * Helper to write a compose file to the path ComposeFileEditor expects
 */
function writeInstalledCompose(compose: Compose): string {
  const composePath = getDockerComposePath(dnpName, isCore);
  const dir = path.dirname(composePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(composePath, yamlDump(compose));
  return composePath;
}

/**
 * Cleanup the installed compose file
 */
function removeInstalledCompose(): void {
  const composePath = getDockerComposePath(dnpName, isCore);
  if (fs.existsSync(composePath)) fs.unlinkSync(composePath);
}

/**
 * Build a minimal dappmanager compose
 */
function buildDappmanagerCompose(overrides?: {
  environment?: Record<string, string> | string[];
  volumes?: string[];
}): Compose {
  return {
    version: "3.5",
    services: {
      "dappmanager.dnp.dappnode.eth": {
        image: "dappmanager.dnp.dappnode.eth:0.2.71",
        container_name: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
        volumes: overrides?.volumes ?? [
          "/run/dbus/system_bus_socket:/run/dbus/system_bus_socket",
          "dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo/",
          "/usr/src/dappnode/DNCORE:/usr/src/app/DNCORE",
          "/var/run/docker.sock:/var/run/docker.sock"
        ],
        environment: overrides?.environment ?? {
          LOG_LEVEL: "info"
        }
      }
    },
    networks: {
      dncore_network: { external: true }
    }
  };
}

describe("persistDappmanagerSettings", () => {
  afterEach(() => {
    removeInstalledCompose();
  });

  it("Should be a no-op for non-dappmanager packages", () => {
    const compose = new ComposeEditor(buildDappmanagerCompose(), { dnpName });
    const before = JSON.stringify(compose.compose);

    // Call with a different dnpName
    persistDappmanagerSettings(compose, "other.dnp.dappnode.eth", isCore);

    expect(JSON.stringify(compose.compose)).to.equal(before);
  });

  it("Should be a no-op when no installed compose exists (fresh install)", () => {
    // Don't write any compose to disk
    removeInstalledCompose();

    const newCompose = buildDappmanagerCompose();
    const compose = new ComposeEditor(newCompose, { dnpName });
    const before = JSON.stringify(compose.compose);

    // Should not throw
    persistDappmanagerSettings(compose, dnpName, isCore);

    expect(JSON.stringify(compose.compose)).to.equal(before);
  });

  it("Should persist DISABLE_HOST_SCRIPTS from installed compose", () => {
    // Write installed compose with DISABLE_HOST_SCRIPTS=true
    writeInstalledCompose(
      buildDappmanagerCompose({
        environment: {
          LOG_LEVEL: "info",
          DISABLE_HOST_SCRIPTS: "true"
        }
      })
    );

    // New compose does NOT have DISABLE_HOST_SCRIPTS
    const newCompose = buildDappmanagerCompose({
      environment: { LOG_LEVEL: "info" }
    });
    const compose = new ComposeEditor(newCompose, { dnpName });

    persistDappmanagerSettings(compose, dnpName, isCore);

    const service = compose.compose.services["dappmanager.dnp.dappnode.eth"];
    const envs = parseEnvironment(service.environment || []);
    expect(envs["DISABLE_HOST_SCRIPTS"]).to.equal("true");
    // Original env preserved
    expect(envs["LOG_LEVEL"]).to.equal("info");
  });

  it("Should persist DAPPNODE_CORE_DIR from installed compose", () => {
    writeInstalledCompose(
      buildDappmanagerCompose({
        environment: {
          LOG_LEVEL: "info",
          DAPPNODE_CORE_DIR: "/custom/path/DNCORE"
        }
      })
    );

    const newCompose = buildDappmanagerCompose({
      environment: { LOG_LEVEL: "info" }
    });
    const compose = new ComposeEditor(newCompose, { dnpName });

    persistDappmanagerSettings(compose, dnpName, isCore);

    const service = compose.compose.services["dappmanager.dnp.dappnode.eth"];
    const envs = parseEnvironment(service.environment || []);
    expect(envs["DAPPNODE_CORE_DIR"]).to.equal("/custom/path/DNCORE");
  });

  it("Should persist both DISABLE_HOST_SCRIPTS and DAPPNODE_CORE_DIR", () => {
    writeInstalledCompose(
      buildDappmanagerCompose({
        environment: {
          LOG_LEVEL: "info",
          DISABLE_HOST_SCRIPTS: "true",
          DAPPNODE_CORE_DIR: "/custom/path/DNCORE"
        }
      })
    );

    const newCompose = buildDappmanagerCompose({
      environment: { LOG_LEVEL: "debug" }
    });
    const compose = new ComposeEditor(newCompose, { dnpName });

    persistDappmanagerSettings(compose, dnpName, isCore);

    const service = compose.compose.services["dappmanager.dnp.dappnode.eth"];
    const envs = parseEnvironment(service.environment || []);
    expect(envs["DISABLE_HOST_SCRIPTS"]).to.equal("true");
    expect(envs["DAPPNODE_CORE_DIR"]).to.equal("/custom/path/DNCORE");
    // Original env kept
    expect(envs["LOG_LEVEL"]).to.equal("debug");
  });

  it("Should update DNCORE volume host path to match DAPPNODE_CORE_DIR", () => {
    const customDir = "/custom/path/DNCORE";
    writeInstalledCompose(
      buildDappmanagerCompose({
        environment: {
          DAPPNODE_CORE_DIR: customDir
        }
      })
    );

    // New compose has default volume path
    const newCompose = buildDappmanagerCompose({
      environment: { LOG_LEVEL: "info" },
      volumes: [
        "dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo/",
        "/usr/src/dappnode/DNCORE:/usr/src/app/DNCORE",
        "/var/run/docker.sock:/var/run/docker.sock"
      ]
    });
    const compose = new ComposeEditor(newCompose, { dnpName });

    persistDappmanagerSettings(compose, dnpName, isCore);

    const service = compose.compose.services["dappmanager.dnp.dappnode.eth"];
    // The DNCORE volume should now point to the custom dir
    expect(service.volumes).to.include(`${customDir}:/usr/src/app/DNCORE`);
    // Other volumes untouched
    expect(service.volumes).to.include("dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo");
    expect(service.volumes).to.include("/var/run/docker.sock:/var/run/docker.sock");
  });

  it("Should not modify volumes when DAPPNODE_CORE_DIR is not set in installed compose", () => {
    // Installed compose with DISABLE_HOST_SCRIPTS but no DAPPNODE_CORE_DIR
    writeInstalledCompose(
      buildDappmanagerCompose({
        environment: {
          DISABLE_HOST_SCRIPTS: "true"
        }
      })
    );

    const volumes = [
      "dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo/",
      "/usr/src/dappnode/DNCORE:/usr/src/app/DNCORE",
      "/var/run/docker.sock:/var/run/docker.sock"
    ];
    const newCompose = buildDappmanagerCompose({
      environment: { LOG_LEVEL: "info" },
      volumes
    });
    const compose = new ComposeEditor(newCompose, { dnpName });

    persistDappmanagerSettings(compose, dnpName, isCore);

    const service = compose.compose.services["dappmanager.dnp.dappnode.eth"];
    // Default DNCORE path preserved
    expect(service.volumes).to.include("/usr/src/dappnode/DNCORE:/usr/src/app/DNCORE");
  });

  it("Should be a no-op when installed compose has no relevant envs", () => {
    // Installed compose with no special envs
    writeInstalledCompose(
      buildDappmanagerCompose({
        environment: {
          LOG_LEVEL: "info",
          SOME_OTHER_VAR: "value"
        }
      })
    );

    const newCompose = buildDappmanagerCompose({
      environment: { LOG_LEVEL: "debug" }
    });
    const compose = new ComposeEditor(newCompose, { dnpName });
    const envsBefore = parseEnvironment(compose.compose.services["dappmanager.dnp.dappnode.eth"].environment || []);

    persistDappmanagerSettings(compose, dnpName, isCore);

    const envsAfter = parseEnvironment(compose.compose.services["dappmanager.dnp.dappnode.eth"].environment || []);
    expect(envsAfter).to.deep.equal(envsBefore);
  });

  it("Should handle installed compose with environment as array format", () => {
    writeInstalledCompose(
      buildDappmanagerCompose({
        environment: ["LOG_LEVEL=info", "DISABLE_HOST_SCRIPTS=true", "DAPPNODE_CORE_DIR=/custom/dir"]
      })
    );

    const newCompose = buildDappmanagerCompose({
      environment: { LOG_LEVEL: "info" }
    });
    const compose = new ComposeEditor(newCompose, { dnpName });

    persistDappmanagerSettings(compose, dnpName, isCore);

    const service = compose.compose.services["dappmanager.dnp.dappnode.eth"];
    const envs = parseEnvironment(service.environment || []);
    expect(envs["DISABLE_HOST_SCRIPTS"]).to.equal("true");
    expect(envs["DAPPNODE_CORE_DIR"]).to.equal("/custom/dir");
  });

  it("Should not overwrite DNCORE volume if no volume matches the container path", () => {
    const customDir = "/custom/path/DNCORE";
    writeInstalledCompose(
      buildDappmanagerCompose({
        environment: {
          DAPPNODE_CORE_DIR: customDir
        }
      })
    );

    // New compose with no DNCORE volume
    const newCompose = buildDappmanagerCompose({
      environment: { LOG_LEVEL: "info" },
      volumes: ["dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo/", "/var/run/docker.sock:/var/run/docker.sock"]
    });
    const compose = new ComposeEditor(newCompose, { dnpName });

    persistDappmanagerSettings(compose, dnpName, isCore);

    const service = compose.compose.services["dappmanager.dnp.dappnode.eth"];
    // No DNCORE volume should be added — only existing volumes modified
    expect(service.volumes).to.have.lengthOf(2);
    expect(service.volumes).to.include("dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo");
    expect(service.volumes).to.include("/var/run/docker.sock:/var/run/docker.sock");
  });
});
