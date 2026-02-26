import { Compose, Manifest } from "@dappnode/types";
import { setDappnodeComposeDefaults } from "../../../src/setDappnodeComposeDefaults.js";

const expectedEnvFilePresent = process.argv[2] === "true";

const manifest: Manifest = {
  name: "some-package.dnp.dappnode.eth",
  version: "0.1.0",
  type: "service",
  architectures: ["linux/amd64"]
};

const composeWithNonWhitelistedKey: Compose = {
  version: "3.5",
  services: {
    app: {
      image: "app.some-package.dnp.dappnode.eth:0.1.0",
      // Non-whitelisted key (NOT in dockerComposeSafeKeys)
      env_file: ["./secrets.env"],
      environment: {
        FOO: "bar"
      }
    }
  },
  volumes: {
    appdata: {}
  }
};

const safeCompose = setDappnodeComposeDefaults(composeWithNonWhitelistedKey, manifest);
const envFilePresent = Object.prototype.hasOwnProperty.call(safeCompose.services.app, "env_file");

if (envFilePresent !== expectedEnvFilePresent) {
  console.error(
    JSON.stringify(
      {
        SKIP_COMPOSE_VALIDATION: process.env.SKIP_COMPOSE_VALIDATION,
        expectedEnvFilePresent,
        envFilePresent,
        serviceKeys: Object.keys(safeCompose.services.app)
      },
      null,
      2
    )
  );
  process.exit(1);
}
