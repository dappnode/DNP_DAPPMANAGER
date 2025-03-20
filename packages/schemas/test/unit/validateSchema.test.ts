import { expect } from "chai";
import {
  validateComposeSchema,
  validateManifestSchema,
  validateSetupWizardSchema,
  validateNotificationsSchema
} from "../../src/index.js";
import fs from "fs";
import path from "path";
import { cleanTestDir, testDir } from "../testUtils.js";
import { Manifest, SetupWizard, NotificationsConfig, GatusEndpoint, CustomEndpoint } from "@dappnode/types";

describe("schemaValidation", function () {
  this.timeout(10000);
  describe("manifest", () => {
    before(() => {
      cleanTestDir();
      fs.mkdirSync(testDir, { recursive: true });
    });
    it("validateManifest globalEnvs as array of objects", () => {
      const manifest: Manifest = {
        name: "example.dnp.dappnode.eth",
        version: "1.0.0",
        description: "",
        type: "dncore",
        license: "1",
        globalEnvs: [
          {
            services: ["web3signer", "ui"],
            envs: ["_DAPPNODE_GLOBAL_INTERNAL_IP", "_DAPPNODE_GLOBAL_PUBLIC_IP"]
          },
          {
            services: ["db"],
            envs: ["_DAPPNODE_GLOBAL_PUBKEY"]
          }
        ],
        chain: {
          driver: "ethereum"
        }
      };

      expect(() => validateManifestSchema(manifest)).to.not.throw();
    });

    it("validateManifest chainDriver as string", () => {
      const manifest: Manifest = {
        name: "",
        version: "1.0.0",
        description: "",
        type: "dncore",
        license: "1",
        chain: {
          driver: "ethereum"
        }
      };

      expect(() => validateManifestSchema(manifest)).to.not.throw();
    });

    it("validateManifest chainDriver as object", () => {
      const manifest: Manifest = {
        name: "",
        version: "1.0.0",
        description: "",
        type: "dncore",
        license: "1",
        chain: "ethereum"
      };

      expect(() => validateManifestSchema(manifest)).to.not.throw();
    });

    it("throw error validating with wrong chain", () => {
      // Override chain property with invalid valid to test schema
      const manifest: Omit<Manifest, "chain"> & { chain: string } = {
        name: "",
        version: "1.0.0",
        description: "",
        type: "dncore",
        license: "1",
        chain: "notAllowed"
      };

      expect(() => validateManifestSchema(manifest as Manifest)).to.throw();
    });
  });

  describe("compose", () => {
    before(() => {
      //cleanTestDir();
      fs.mkdirSync(testDir, { recursive: true });
    });
    it("should validate a valid compose", async () => {
      const validCompose = `version: "3.4"
services:
  beacon-chain:
    image: "beacon-chain.prysm-prater.dnp.dappnode.eth:1.0.0"
    volumes:
      - "beacon-chain-data:/data"
    ports:
      - "13000"
      - 12000/udp
    restart: unless-stopped
    environment:
      HTTP_WEB3PROVIDER: "http://goerli-geth.dappnode:8545"
      CHECKPOINT_SYNC_URL: ""
      CORSDOMAIN: "http://prysm-prater.dappnode"
      WEB3_BACKUP: ""
      EXTRA_OPTS: ""
  validator:
    image: "validator.prysm-prater.dnp.dappnode.eth:1.0.0"
    volumes:
      - "validator-data:/root/"
    restart: unless-stopped
    environment:
      LOG_TYPE: INFO
      BEACON_RPC_PROVIDER: "beacon-chain.prysm-prater.dappnode:4000"
      BEACON_RPC_GATEWAY_PROVIDER: "beacon-chain.prysm-prater.dappnode:3500"
      GRAFFITI: validating_from_DAppNode
      EXTRA_OPTS: ""
      FEE_RECIPIENT_ADDRESS: ""
volumes:
  beacon-chain-data: {}
  validator-data: {}`;
      const validComposePath = path.join(testDir, "valid-docker-compose.yml");
      fs.writeFileSync(validComposePath, validCompose);
      expect(async () => await validateComposeSchema([validComposePath])).to.not.throw();
    });

    it("should throw error with an invalid compose", async () => {
      const invalidCompose = `version: "3.5"
services:
  ui:
    image: "ui.web3signer-gnosis.dnp.dappnode.eth:0.1.0"
    build:
      context: ui
    restart: unless-stopped
  web3signer:
    image: "web3signer.web3signer-gnosis.dnp.dappnode.eth:0.1.0"
    depends_on:
      - postgres
    security_opt:
      - "seccomp:unconfined"
    environment:
      ETH2_CLIENT: ""
      LOG_TYPE: INFO
      EXTRA_OPTS: ""
    volumes:
      - "web3signer_data:/opt/web3signer"
    restart: unless-stopped
  postgres:
    notAllowed: wrong
    image: "postgres.web3signer-gnosis.dnp.dappnode.eth:0.1.0"
    healthcheck:
      test: pg_isready -U postgres
      interval: 5s
      timeout: 5s
      retries: 5
    build:
      context: postgres
      dockerfile: Dockerfile
      args:
        UPSTREAM_VERSION: 22.6.0
    user: postgres
    volumes:
      - "postgres_data:/var/lib/postgresql/data"
      - "postgres_migrations:/docker-entrypoint-initdb.d"
    restart: unless-stopped
volumes:
  web3signer_data: {}
  postgres_data: {}
  postgres_migrations: {}`;
      const invalidComposePath = path.join(testDir, "invalid-docker-compose.yml");
      fs.writeFileSync(invalidComposePath, invalidCompose);

      const error = await validateComposeSchema([invalidComposePath]).catch((e) => e);
      console.log(error);
      const expectedErrorMessage = `Invalid compose`;
      expect(error.message).to.include(expectedErrorMessage);
    });

    it("should validate a merged compose file", async () => {
      const validCompose1 = `version: "3.4"
  services:
  beacon-chain:
    image: "beacon-chain.prysm-prater.dnp.dappnode.eth:1.0.0"
    volumes:
      - "beacon-chain-data:/data"
    ports:
      - "13000"
      - 12000/udp
    restart: unless-stopped
    environment:
      HTTP_WEB3PROVIDER: "http://goerli-geth.dappnode:8545"
      CHECKPOINT_SYNC_URL: ""
      CORSDOMAIN: "http://prysm-prater.dappnode"
      WEB3_BACKUP: ""
      EXTRA_OPTS: ""
  validator:
    image: "validator.prysm-prater.dnp.dappnode.eth:1.0.0"
    volumes:
      - "validator-data:/root/"
    restart: unless-stopped
    environment:
      LOG_TYPE: INFO
      BEACON_RPC_PROVIDER: "beacon-chain.prysm-prater.dappnode:4000"
      BEACON_RPC_GATEWAY_PROVIDER: "beacon-chain.prysm-prater.dappnode:3500"
      GRAFFITI: validating_from_DAppNode
      EXTRA_OPTS: ""
      FEE_RECIPIENT_ADDRESS: ""
  volumes:
  beacon-chain-data: {}
  validator-data: {}`;

      const validCompose2 = `version: "3.4"
  services:
  beacon-chain:
    environment:
      ANOTHER_BEACON_ENV: "another-beacon-env-value"
  validator:
    environment:
    ANOTHER_VALIDATOR_ENV: "another-validator-env-value"`;

      const validComposePath1 = path.join(testDir, "valid-docker-compose-1.yml");
      const validComposePath2 = path.join(testDir, "valid-docker-compose-2.yml");

      fs.writeFileSync(validComposePath1, validCompose1);
      fs.writeFileSync(validComposePath2, validCompose2);

      expect(async () => await validateComposeSchema([validComposePath1, validComposePath2])).to.not.throw();
    });
  });

  describe("setupWizard", () => {
    before(() => {
      cleanTestDir();
      fs.mkdirSync(testDir, { recursive: true });
    });
    it("should validate a valid setupWizard", () => {
      const validSetupWizard: SetupWizard = {
        version: "2",
        fields: [
          {
            id: "GRAFFITI",
            target: {
              type: "environment",
              name: "GRAFFITI",
              service: "validator"
            },
            title: "Graffiti",
            maxLength: 32,
            description: "Add a string to your proposed blocks, which will be seen on the block explorer"
          },
          {
            id: "HTTP_WEB3PROVIDER",
            target: {
              type: "environment",
              name: "HTTP_WEB3PROVIDER",
              service: ["validator", "beacon-chain"]
            },
            title: "Eth1.x node URL",
            description: "URL to the Eth1.x node need for the Beacon chain."
          },
          {
            id: "web3Backup",
            target: {
              type: "environment",
              name: "WEB3_BACKUP",
              service: "beacon-chain"
            },
            title: "Add a backup web3 provider",
            description:
              "It's a good idea to add a backup web3 provider in case your main one goes down. For example, if your primary EL client is a local Geth, but you want to use Infura as a backup. Get your web3 backup from [infura](https://infura.io/) (i.e https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@eth2-beacon-prater.infura.io)",
            required: false
          },
          {
            id: "checkpointSyncUrl",
            target: {
              type: "environment",
              name: "CHECKPOINT_SYNC_URL",
              service: "beacon-chain"
            },
            title: "Checkpoint for fast sync",
            description:
              "To get Prysm up and running in only a few minutes, you can start Prysm from a recent finalized checkpoint state rather than syncing from genesis. This is substantially **faster** and consumes **less resources** than syncing from genesis, while still providing all the same features. Be sure you are using a trusted node for the fast sync. Check [Prysm docs](https://docs.prylabs.network/docs/prysm-usage/parameters/) Get your checkpoint sync from [infura](https://infura.io/) (i.e https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@eth2-beacon-prater.infura.io)",
            required: false
          }
        ]
      } as SetupWizard;

      expect(() => validateSetupWizardSchema(validSetupWizard)).to.not.throw();
    });

    it("should throw error with an invalid setupWizard", () => {
      const invalidSetupWizardString: SetupWizard = {
        version: "2",
        fields: [
          {
            id: "GRAFFITI",
            target: {
              type: "environment",
              name: "GRAFFITI",
              service: "validator"
            },
            title: "Graffiti",
            maxLength: 32,
            description: "Add a string to your proposed blocks, which will be seen on the block explorer"
          },
          {
            id: "HTTP_WEB3PROVIDER",
            target: {
              type: "environment",
              name: "HTTP_WEB3PROVIDER",
              service: "beacon-chain"
            },
            title: "Eth1.x node URL",
            description: "URL to the Eth1.x node need for the Beacon chain."
          },
          {
            id: "web3Backup",
            target: {
              type: "environment",
              name: "WEB3_BACKUP",
              service: "beacon-chain"
            },
            title: "Add a backup web3 provider",
            description:
              "It's a good idea to add a backup web3 provider in case your main one goes down. For example, if your primary EL client is a local Geth, but you want to use Infura as a backup. Get your web3 backup from [infura](https://infura.io/) (i.e https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@eth2-beacon-prater.infura.io)",
            required: false
          },
          {
            id: "checkpointSyncUrl",
            target: {
              type: "environment",
              name: "CHECKPOINT_SYNC_URL",
              service: "beacon-chain"
            },
            title: "Checkpoint for fast sync",
            description:
              "To get Prysm up and running in only a few minutes, you can start Prysm from a recent finalized checkpoint state rather than syncing from genesis. This is substantially **faster** and consumes **less resources** than syncing from genesis, while still providing all the same features. Be sure you are using a trusted node for the fast sync. Check [Prysm docs](https://docs.prylabs.network/docs/prysm-usage/parameters/) Get your checkpoint sync from [infura](https://infura.io/) (i.e https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@eth2-beacon-prater.infura.io)",
            required: false
          },
          {
            notAllowed: "random"
          }
        ]
      } as SetupWizard;

      expect(() => validateSetupWizardSchema(invalidSetupWizardString)).to.throw();
    });

    it("should throw error with an empty service array in setupWizard", () => {
      const invalidSetupWizard: SetupWizard = {
        version: "2",
        fields: [
          {
            id: "GRAFFITI",
            target: {
              type: "environment",
              name: "GRAFFITI",
              service: []
            },
            title: "Graffiti",
            maxLength: 32,
            description: "Add a string to your proposed blocks, which will be seen on the block explorer"
          }
        ]
      } as unknown as SetupWizard;

      expect(() => validateSetupWizardSchema(invalidSetupWizard)).to.throw();
    });

    it("should allow a manifest with upstream settings defined as an array of objects", () => {
      const manifest: Manifest = {
        name: "example.dnp.dappnode.eth",
        version: "1.0.0",
        description: "A sample DAppNode package",
        type: "service",
        license: "MIT",
        upstream: [
          {
            repo: "ethereum/go-ethereum",
            version: "1.9.24",
            arg: "GETH_VERSION"
          }
        ]
      };

      expect(() => validateManifestSchema(manifest)).to.not.throw();
    });

    it("should allow a manifest with the upstream settings defined as separate strings", () => {
      const manifest: Manifest = {
        name: "example.dnp.dappnode.eth",
        version: "1.0.0",
        description: "A sample DAppNode package",
        type: "service",
        license: "MIT",
        upstreamRepo: "ethereum/go-ethereum",
        upstreamVersion: "1.9.24",
        upstreamArg: "GETH_VERSION"
      };

      expect(() => validateManifestSchema(manifest)).to.not.throw();
    });

    it("should not allow a manifest with upstream settings defined in both possible ways", () => {
      const manifest: Manifest = {
        // Using 'any' to bypass TypeScript checks for invalid schema
        name: "example.dnp.dappnode.eth",
        version: "1.0.0",
        description: "A sample DAppNode package",
        type: "service",
        license: "MIT",
        upstream: [
          {
            repo: "ethereum/go-ethereum",
            version: "1.9.24",
            arg: "GETH_VERSION"
          }
        ],
        upstreamRepo: "ethereum/go-ethereum",
        upstreamVersion: "1.9.24",
        upstreamArg: "GETH_VERSION"
      };

      expect(() => validateManifestSchema(manifest)).to.throw();
    });

    it("should allow a manifest without any upstream definitions", () => {
      const manifest: Manifest = {
        name: "example.dnp.dappnode.eth",
        version: "1.0.0",
        description: "A sample DAppNode package",
        type: "service",
        license: "MIT"
      };

      expect(() => validateManifestSchema(manifest)).to.not.throw();
    });
  });

  describe("notifications", () => {
    it("should validate a valid notifications configuration", () => {
      const validNotifications: NotificationsConfig = {
        endpoints: [
          {
            name: "example-endpoint",
            enabled: true,
            url: "http://example.com",
            method: "POST",
            conditions: ["response-time < 500ms", "status == 200"],
            interval: "1m",
            group: "example-group",
            alerts: [
              {
                type: "response-time",
                "failure-threshold": 3,
                "success-threshold": 2,
                "send-on-resolved": true,
                description: "Response time exceeded",
                enabled: true
              }
            ],
            definition: {
              title: "Example Endpoint",
              description: "An example endpoint for testing"
            },
            metric: {
              min: 0,
              max: 1000,
              unit: "ms"
            }
          }
        ]
      };

      expect(() => validateNotificationsSchema(validNotifications)).to.not.throw();
    });

    it("should throw an error for missing required fields", () => {
      const invalidNotifications: Partial<NotificationsConfig> = {
        endpoints: [
          {
            name: "example-endpoint",
            enabled: true,
            url: "http://example.com",
            method: "POST"
            // Missing required fields like conditions, interval, group, alerts, and definition
          } as GatusEndpoint
        ]
      };

      expect(() => validateNotificationsSchema(invalidNotifications as NotificationsConfig)).to.throw(
        "Invalid notifications configuration"
      );
    });

    it("should throw an error for invalid URL format", () => {
      const invalidNotifications: NotificationsConfig = {
        endpoints: [
          {
            name: "example-endpoint",
            enabled: true,
            url: "invalid-url",
            method: "POST",
            conditions: ["response-time < 500ms"],
            interval: "1m",
            group: "example-group",
            alerts: [
              {
                type: "response-time",
                "failure-threshold": 3,
                "success-threshold": 2,
                "send-on-resolved": true,
                description: "Response time exceeded",
                enabled: true
              }
            ],
            definition: {
              title: "Example Endpoint",
              description: "An example endpoint for testing"
            }
          }
        ]
      };

      expect(() => validateNotificationsSchema(invalidNotifications)).to.throw("Invalid notifications configuration");
    });

    it("should throw an error for invalid interval format", () => {
      const invalidNotifications: NotificationsConfig = {
        endpoints: [
          {
            name: "example-endpoint",
            enabled: true,
            url: "http://example.com",
            method: "POST",
            conditions: ["response-time < 500ms"],
            interval: "invalid-interval",
            group: "example-group",
            alerts: [
              {
                type: "response-time",
                "failure-threshold": 3,
                "success-threshold": 2,
                "send-on-resolved": true,
                description: "Response time exceeded",
                enabled: true
              }
            ],
            definition: {
              title: "Example Endpoint",
              description: "An example endpoint for testing"
            }
          }
        ]
      };

      expect(() => validateNotificationsSchema(invalidNotifications)).to.throw("Invalid notifications configuration");
    });

    it("should throw an error for missing alert fields", () => {
      const invalidNotifications: NotificationsConfig = {
        endpoints: [
          {
            name: "example-endpoint",
            enabled: true,
            url: "http://example.com",
            method: "POST",
            conditions: ["response-time < 500ms"],
            interval: "1m",
            group: "example-group",
            alerts: [
              {
                type: "response-time",
                "failure-threshold": 3,
                // Missing success-threshold and other required fields
                "send-on-resolved": true,
                description: "Response time exceeded",
                enabled: true
              }
            ],
            definition: {
              title: "Example Endpoint",
              description: "An example endpoint for testing"
            }
          } as GatusEndpoint
        ]
      };

      expect(() => validateNotificationsSchema(invalidNotifications)).to.throw("Invalid notifications configuration");
    });

    it("should validate a valid notifications configuration with customEndpoints", () => {
      const validNotifications: NotificationsConfig = {
        customEndpoints: [
          {
            enabled: true,
            name: "custom-endpoint",
            description: "A custom endpoint for testing", // Added required description
            metric: {
              treshold: 90,
              min: 0,
              max: 100,
              unit: "%"
            }
          }
        ]
      };

      expect(() => validateNotificationsSchema(validNotifications)).to.not.throw();
    });

    it("should throw an error for missing required fields in customEndpoints", () => {
      const invalidNotifications: NotificationsConfig = {
        customEndpoints: [
          {
            enabled: true,
            name: "custom-endpoint",
            // Missing required description field
            group: "custom-group"
          } as unknown as CustomEndpoint
        ]
      };

      expect(() => validateNotificationsSchema(invalidNotifications)).to.throw("Invalid notifications configuration");
    });

    it("should throw an error for invalid metric in customEndpoints", () => {
      const invalidNotifications: NotificationsConfig = {
        customEndpoints: [
          {
            enabled: true,
            name: "custom-endpoint",
            description: "A custom endpoint for testing",
            metric: {
              treshold: "fd" as unknown as number, // Invalid treshold value
              min: 0,
              max: 100,
              unit: "%"
            }
          } as CustomEndpoint
        ]
      };

      expect(() => validateNotificationsSchema(invalidNotifications)).to.throw("Invalid notifications configuration");
    });

    it("should validate a configuration with both endpoints and customEndpoints", () => {
      const validNotifications: NotificationsConfig = {
        endpoints: [
          {
            name: "example-endpoint",
            enabled: true,
            url: "http://example.com",
            method: "POST",
            conditions: ["response-time < 500ms", "status == 200"],
            interval: "1m",
            group: "example-group",
            alerts: [
              {
                type: "response-time",
                "failure-threshold": 3,
                "success-threshold": 2,
                "send-on-resolved": true,
                description: "Response time exceeded",
                enabled: true
              }
            ],
            definition: {
              title: "Example Endpoint",
              description: "An example endpoint for testing"
            },
            metric: {
              min: 0,
              max: 1000,
              unit: "ms"
            }
          }
        ],
        customEndpoints: [
          {
            enabled: true,
            name: "custom-endpoint",
            description: "A custom endpoint for testing", // Added required description
            metric: {
              treshold: 90,
              min: 0,
              max: 100,
              unit: "%"
            }
          }
        ]
      };

      expect(() => validateNotificationsSchema(validNotifications)).to.not.throw();
    });
  });
});
