import "mocha";
import { expect } from "chai";
import {
  Compose,
  Manifest,
  validateDappnodeCompose
} from\s+"@dappnode/types";
import { setDappnodeComposeDefaults } from "../../../../src/modules/compose/setDappnodeComposeDefaults.js";

describe("setDappnodeComposeDefaults", () => {
  it("Should set dappnode defaults to a validated compose from a non-core package", () => {
    const compose: Compose = {
      version: "3.5",
      services: {
        "beacon-chain": {
          build: {
            context: "./beacon-chain",
            args: {
              BEACON_API_PORT: "3500",
              UPSTREAM_VERSION: "22.6.1"
            }
          },
          environment: {
            LOG_TYPE: "INFO",
            BEACON_API_PORT: "3500",
            HTTP_WEB3PROVIDER: "http://nethermind-xdai.dappnode:8545",
            CHECKPOINT_SYNC_URL: "",
            EXTRA_OPTS: ""
          },
          volumes: ["teku-gnosis-data:/opt/teku/data"],
          ports: ["9000/tcp", "9000/udp"],
          restart: "unless-stopped",
          image: "beacon-chain.teku-gnosis.dnp.dappnode.eth:0.1.0"
        },
        validator: {
          build: {
            context: "./validator",
            args: {
              UPSTREAM_VERSION: "22.6.1"
            }
          },
          environment: {
            LOG_TYPE: "INFO",
            BEACON_NODE_ADDR: "http://beacon-chain.teku-gnosis.dappnode:3500",
            GRAFFITI: "validating_from_DAppNode",
            EXTRA_OPTS: "",
            FEE_RECIPIENT_ADDRESS: ""
          },
          restart: "unless-stopped",
          image: "validator.teku-gnosis.dnp.dappnode.eth:0.1.0"
        }
      },
      volumes: {
        "teku-gnosis-data": {}
      }
    };
    const manifest: Manifest = {
      name: "teku-gnosis.dnp.dappnode.eth",
      version: "0.1.0",
      upstreamVersion: "22.6.1",
      architectures: ["linux/amd64"],
      upstreamRepo: "ConsenSys/teku",
      shortDescription: "Teku Gnosis Chain CL Beacon chain + validator",
      description:
        "Teku Gnosis Chain Consensus Layer (CL) Beacon chain + validator developed by the ConsenSys Team",
      type: "service",
      author:
        "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
      contributors: [
        "mgarciate <mgarciate@gmail.com> (https://github.com/mgarciate)",
        "pablomendezroyo <mendez4a@gmail.com> (https://github.com/pablomendezroyo"
      ],
      categories: ["Blockchain"],
      repository: {
        type: "git",
        url: "git+https://github.com/ConsenSys/teku.git"
      },
      bugs: {
        url: "https://github.com/ConsenSys/teku/issues"
      },
      links: {
        ui: "http://ui.web3signer-gnosis.dappnode?signer_url=http://web3signer.web3signer-gnosis.dappnode:9000",
        homepage: "https://docs.teku.consensys.net",
        readme: "https://github.com/ConsenSys/teku/blob/master/README.md",
        docs: "https://docs.teku.consensys.net"
      },
      license: "Apache-2.0",
      requirements: {
        minimumDappnodeVersion: "0.2.56"
      },
      chain: {
        driver: "ethereum-beacon-chain",
        serviceName: "beacon-chain",
        portNumber: 3500
      },
      dependencies: {
        "web3signer-gnosis.dnp.dappnode.eth": "latest"
      },
      warnings: {
        onRemove:
          "Make sure your web3signer does not have this client selected or you will stop validating! (Packages > web3signer > config > client)"
      }
    };

    const expectedCompose: Compose = {
      version: "3.5",
      services: {
        "beacon-chain": {
          container_name:
            "DAppNodePackage-beacon-chain.teku-gnosis.dnp.dappnode.eth",
          dns: "172.33.1.2",
          environment: {
            LOG_TYPE: "INFO",
            BEACON_API_PORT: "3500",
            HTTP_WEB3PROVIDER: "http://nethermind-xdai.dappnode:8545",
            CHECKPOINT_SYNC_URL: "",
            EXTRA_OPTS: ""
          },
          image: "beacon-chain.teku-gnosis.dnp.dappnode.eth:0.1.0",
          logging: {
            driver: "json-file",
            options: { "max-size": "10m", "max-file": "3" }
          },
          networks: {
            dncore_network: { aliases: ["beacon-chain.teku-gnosis.dappnode"] }
          },
          ports: ["9000/tcp", "9000/udp"],
          restart: "unless-stopped",
          volumes: ["teku-gnosis-data:/opt/teku/data"]
        },
        validator: {
          container_name:
            "DAppNodePackage-validator.teku-gnosis.dnp.dappnode.eth",
          dns: "172.33.1.2",
          environment: {
            LOG_TYPE: "INFO",
            BEACON_NODE_ADDR: "http://beacon-chain.teku-gnosis.dappnode:3500",
            GRAFFITI: "validating_from_DAppNode",
            EXTRA_OPTS: "",
            FEE_RECIPIENT_ADDRESS: ""
          },
          image: "validator.teku-gnosis.dnp.dappnode.eth:0.1.0",
          logging: {
            driver: "json-file",
            options: { "max-size": "10m", "max-file": "3" }
          },
          networks: {
            dncore_network: { aliases: ["validator.teku-gnosis.dappnode"] }
          },
          restart: "unless-stopped"
        }
      },
      volumes: { "teku-gnosis-data": {} },
      networks: { dncore_network: { external: true } }
    };

    validateDappnodeCompose(compose, manifest);
    const composeWithDefaults = setDappnodeComposeDefaults(compose, manifest);

    expect(composeWithDefaults).to.deep.equal(expectedCompose);
  });

  it("Should set dappnode defaults to a validated compose from a core package", () => {
    const compose: Compose = {
      version: "3.5",
      networks: {
        dncore_network: {
          name: "dncore_network",
          external: true
        }
      },
      volumes: {
        dappmanagerdnpdappnodeeth_data: {}
      },
      services: {
        "dappmanager.dnp.dappnode.eth": {
          build: ".",
          image: "dappmanager.dnp.dappnode.eth:0.2.41",
          container_name: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
          volumes: [
            "/run/dbus/system_bus_socket:/run/dbus/system_bus_socket",
            "dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo/",
            "/usr/src/dappnode/DNCORE/:/usr/src/app/DNCORE/",
            "/var/run/docker.sock:/var/run/docker.sock",
            "/etc/hostname:/etc/dappnodename:ro"
          ],
          environment: [
            "LOG_LEVEL=info",
            "ETH_MAINNET_RPC_URL_OVERRIDE=",
            "ETH_MAINNET_RPC_URL_REMOTE=",
            "IPFS_HOST=",
            "DISABLE_UPNP="
          ],
          dns: "172.33.1.2",
          networks: {
            dncore_network: {
              ipv4_address: "172.33.1.7",
              aliases: ["dappmanager.dappnode", "my.dappnode", "dappnode.local"]
            }
          }
        }
      }
    };
    const manifest: Manifest = {
      name: "dappmanager.dnp.dappnode.eth",
      version: "0.2.43",
      description:
        "Dappnode package responsible for providing the DappNode Package Manager",
      type: "dncore",
      architectures: ["linux/amd64", "linux/arm64"],
      author:
        "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
      contributors: [
        "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)",
        "DAppLion <dapplion@giveth.io> (https://github.com/dapplion)"
      ],
      keywords: ["DAppNodeCore", "Manager", "Installer"],
      links: {
        ui: "http://my.dappnode/",
        homepage: "https://github.com/dappnode/DNP_DAPPMANAGER#readme"
      },
      repository: {
        type: "git",
        url: "https://github.com/dappnode/DNP_DAPPMANAGER"
      },
      bugs: {
        url: "https://github.com/dappnode/DNP_DAPPMANAGER/issues"
      },
      license: "GPL-3.0"
    };

    const expectedCompose: Compose = {
      version: "3.5",
      services: {
        "dappmanager.dnp.dappnode.eth": {
          container_name: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
          dns: "172.33.1.2",
          environment: {
            LOG_LEVEL: "info",
            ETH_MAINNET_RPC_URL_OVERRIDE: "",
            ETH_MAINNET_RPC_URL_REMOTE: "",
            IPFS_HOST: "",
            DISABLE_UPNP: ""
          },
          image: "dappmanager.dnp.dappnode.eth:0.2.43",
          logging: {
            driver: "json-file",
            options: { "max-size": "10m", "max-file": "3" }
          },
          networks: {
            dncore_network: {
              ipv4_address: "172.33.1.7",
              aliases: ["dappmanager.dappnode", "my.dappnode", "dappnode.local"]
            }
          },
          volumes: [
            "/run/dbus/system_bus_socket:/run/dbus/system_bus_socket",
            "dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo/",
            "/usr/src/dappnode/DNCORE/:/usr/src/app/DNCORE/",
            "/var/run/docker.sock:/var/run/docker.sock",
            "/etc/hostname:/etc/dappnodename:ro"
          ],
          restart: "unless-stopped"
        }
      },
      volumes: { dappmanagerdnpdappnodeeth_data: {} },
      networks: { dncore_network: { name: "dncore_network", external: true } }
    };

    validateDappnodeCompose(compose, manifest);
    const composeWithDefaults = setDappnodeComposeDefaults(compose, manifest);
    expect(composeWithDefaults).to.deep.equal(expectedCompose);
  });
});
