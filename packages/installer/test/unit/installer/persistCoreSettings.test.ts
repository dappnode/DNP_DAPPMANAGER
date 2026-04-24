import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { ComposeEditor } from "@dappnode/dockercompose";
import { Compose } from "@dappnode/types";
import { yamlDump, getDockerComposePath, parseEnvironment } from "@dappnode/utils";
import { params } from "@dappnode/params";
import { persistCoreSettings } from "../../../src/installer/getInstallerPackageData.js";

const coreDnpName = params.coreDnpName;
const dappmanagerDnpName = params.dappmanagerDnpName;
const isCore = true;

/**
 * Helper to write the dappmanager installed compose (source of env values)
 */
function writeDappmanagerCompose(compose: Compose): string {
  const composePath = getDockerComposePath(dappmanagerDnpName, isCore);
  const dir = path.dirname(composePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(composePath, yamlDump(compose));
  return composePath;
}

/**
 * Cleanup the dappmanager installed compose file
 */
function removeDappmanagerCompose(): void {
  const composePath = getDockerComposePath(dappmanagerDnpName, isCore);
  if (fs.existsSync(composePath)) fs.unlinkSync(composePath);
}

/**
 * Build a minimal dappmanager compose
 */
function buildDappmanagerCompose(overrides?: { environment?: Record<string, string> | string[] }): Compose {
  return {
    version: "3.5",
    services: {
      "dappmanager.dnp.dappnode.eth": {
        image: "dappmanager.dnp.dappnode.eth:0.2.71",
        container_name: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
        volumes: ["/usr/src/dappnode/DNCORE:/usr/src/app/DNCORE"],
        environment: overrides?.environment ?? { LOG_LEVEL: "info" }
      }
    },
    networks: {
      dncore_network: { external: true }
    }
  };
}

/**
 * Build a minimal core compose
 */
function buildCoreCompose(overrides?: {
  environment?: Record<string, string> | string[];
  volumes?: string[];
}): Compose {
  return {
    version: "3.5",
    services: {
      "core.dnp.dappnode.eth": {
        image: "core.dnp.dappnode.eth:0.2.71",
        container_name: "DAppNodeCore-core.dnp.dappnode.eth",
        volumes: overrides?.volumes ?? [
          "/usr/src/dappnode/:/usr/src/dappnode/",
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

describe("persistCoreSettings", () => {
  afterEach(() => {
    removeDappmanagerCompose();
  });

  it("Should be a no-op for non-core packages", () => {
    const compose = new ComposeEditor(buildCoreCompose(), { dnpName: coreDnpName });
    const before = JSON.stringify(compose.compose);

    persistCoreSettings(compose, "other.dnp.dappnode.eth", isCore);

    expect(JSON.stringify(compose.compose)).to.equal(before);
  });

  it("Should be a no-op when no installed dappmanager compose exists", () => {
    removeDappmanagerCompose();

    const newCompose = buildCoreCompose();
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });
    const before = JSON.stringify(compose.compose);

    persistCoreSettings(compose, coreDnpName, isCore);

    expect(JSON.stringify(compose.compose)).to.equal(before);
  });

  it("Should persist DISABLE_HOST_SCRIPTS from dappmanager compose to core compose", () => {
    writeDappmanagerCompose(
      buildDappmanagerCompose({
        environment: {
          LOG_LEVEL: "info",
          DISABLE_HOST_SCRIPTS: "true"
        }
      })
    );

    const newCompose = buildCoreCompose({
      environment: { LOG_LEVEL: "info" }
    });
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });

    persistCoreSettings(compose, coreDnpName, isCore);

    const service = compose.compose.services["core.dnp.dappnode.eth"];
    const envs = parseEnvironment(service.environment || []);
    expect(envs["DISABLE_HOST_SCRIPTS"]).to.equal("true");
    expect(envs["LOG_LEVEL"]).to.equal("info");
  });

  it("Should update /usr/src/dappnode/ volume host path to match DAPPNODE_CORE_DIR", () => {
    const customDir = "/custom/path/dappnode/";
    writeDappmanagerCompose(
      buildDappmanagerCompose({
        environment: {
          DAPPNODE_CORE_DIR: customDir
        }
      })
    );

    const newCompose = buildCoreCompose({
      environment: { LOG_LEVEL: "info" },
      volumes: ["/usr/src/dappnode/:/usr/src/dappnode/", "/var/run/docker.sock:/var/run/docker.sock"]
    });
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });

    persistCoreSettings(compose, coreDnpName, isCore);

    const service = compose.compose.services["core.dnp.dappnode.eth"];
    expect(service.volumes).to.include(`${customDir}:/usr/src/dappnode/`);
    expect(service.volumes).to.include("/var/run/docker.sock:/var/run/docker.sock");
  });

  it("Should persist both DISABLE_HOST_SCRIPTS and update volume path", () => {
    const customDir = "/custom/path/dappnode/";
    writeDappmanagerCompose(
      buildDappmanagerCompose({
        environment: {
          LOG_LEVEL: "info",
          DISABLE_HOST_SCRIPTS: "true",
          DAPPNODE_CORE_DIR: customDir
        }
      })
    );

    const newCompose = buildCoreCompose({
      environment: { LOG_LEVEL: "debug" },
      volumes: ["/usr/src/dappnode/:/usr/src/dappnode/", "/var/run/docker.sock:/var/run/docker.sock"]
    });
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });

    persistCoreSettings(compose, coreDnpName, isCore);

    const service = compose.compose.services["core.dnp.dappnode.eth"];
    const envs = parseEnvironment(service.environment || []);
    expect(envs["DISABLE_HOST_SCRIPTS"]).to.equal("true");
    expect(envs["LOG_LEVEL"]).to.equal("debug");
    expect(service.volumes).to.include(`${customDir}:/usr/src/dappnode/`);
  });

  it("Should not modify volumes when DAPPNODE_CORE_DIR is not set", () => {
    writeDappmanagerCompose(
      buildDappmanagerCompose({
        environment: {
          DISABLE_HOST_SCRIPTS: "true"
        }
      })
    );

    const volumes = ["/usr/src/dappnode/:/usr/src/dappnode/", "/var/run/docker.sock:/var/run/docker.sock"];
    const newCompose = buildCoreCompose({
      environment: { LOG_LEVEL: "info" },
      volumes
    });
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });

    persistCoreSettings(compose, coreDnpName, isCore);

    const service = compose.compose.services["core.dnp.dappnode.eth"];
    expect(service.volumes).to.include("/usr/src/dappnode/:/usr/src/dappnode/");
  });

  it("Should be a no-op when dappmanager compose has no relevant envs", () => {
    writeDappmanagerCompose(
      buildDappmanagerCompose({
        environment: {
          LOG_LEVEL: "info",
          SOME_OTHER_VAR: "value"
        }
      })
    );

    const newCompose = buildCoreCompose({
      environment: { LOG_LEVEL: "debug" }
    });
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });
    const envsBefore = parseEnvironment(compose.compose.services["core.dnp.dappnode.eth"].environment || []);

    persistCoreSettings(compose, coreDnpName, isCore);

    const envsAfter = parseEnvironment(compose.compose.services["core.dnp.dappnode.eth"].environment || []);
    expect(envsAfter).to.deep.equal(envsBefore);
  });

  it("Should handle dappmanager compose with environment as array format", () => {
    writeDappmanagerCompose(
      buildDappmanagerCompose({
        environment: ["LOG_LEVEL=info", "DISABLE_HOST_SCRIPTS=true", "DAPPNODE_CORE_DIR=/custom/dir/"]
      })
    );

    const newCompose = buildCoreCompose({
      environment: { LOG_LEVEL: "info" }
    });
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });

    persistCoreSettings(compose, coreDnpName, isCore);

    const service = compose.compose.services["core.dnp.dappnode.eth"];
    const envs = parseEnvironment(service.environment || []);
    expect(envs["DISABLE_HOST_SCRIPTS"]).to.equal("true");
  });

  it("Should not modify volumes if no volume matches the container path", () => {
    const customDir = "/custom/path/dappnode/";
    writeDappmanagerCompose(
      buildDappmanagerCompose({
        environment: {
          DAPPNODE_CORE_DIR: customDir
        }
      })
    );

    const newCompose = buildCoreCompose({
      environment: { LOG_LEVEL: "info" },
      volumes: ["/var/run/docker.sock:/var/run/docker.sock"]
    });
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });

    persistCoreSettings(compose, coreDnpName, isCore);

    const service = compose.compose.services["core.dnp.dappnode.eth"];
    expect(service.volumes).to.have.lengthOf(1);
    expect(service.volumes).to.include("/var/run/docker.sock:/var/run/docker.sock");
  });

  it("Should add environment section even if core compose has no environment", () => {
    writeDappmanagerCompose(
      buildDappmanagerCompose({
        environment: {
          DISABLE_HOST_SCRIPTS: "true"
        }
      })
    );

    // Core compose with no environment
    const newCompose: Compose = {
      version: "3.5",
      services: {
        "core.dnp.dappnode.eth": {
          image: "core.dnp.dappnode.eth:0.2.71",
          container_name: "DAppNodeCore-core.dnp.dappnode.eth",
          volumes: ["/usr/src/dappnode/:/usr/src/dappnode/"]
        }
      }
    };
    const compose = new ComposeEditor(newCompose, { dnpName: coreDnpName });

    persistCoreSettings(compose, coreDnpName, isCore);

    const service = compose.compose.services["core.dnp.dappnode.eth"];
    const envs = parseEnvironment(service.environment || []);
    expect(envs["DISABLE_HOST_SCRIPTS"]).to.equal("true");
  });
});
