import {
  ConsensusClient,
  ExecutionClient,
  MevBoost,
  Network,
  Routes,
  Signer
} from "@dappnode/common";

export const stakerConfig: Pick<
  Routes,
  "stakerConfigGet" | "stakerConfigSet"
> = {
  stakerConfigSet: async () => {},
  stakerConfigGet: async <T extends Network>(network: T) => {
    switch (network) {
      case "mainnet":
        return {
          executionClients: [
            {
              status: "ok",
              dnpName: "geth.dnp.dappnode.eth" as ExecutionClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: true,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,
                metadata: {
                  name: "geth.dnp.dappnode.eth",
                  description:
                    "Go implementation of ethereum. Execution client",
                  shortDescription: "Go implementation of ethereum",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "nethermind.dnp.dappnode.eth" as ExecutionClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "nethermind.dnp.dappnode.eth",
                  description: "Nethermind execution client",
                  shortDescription: "Nethermind execution client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "besu.public.dappnode.eth" as ExecutionClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "besu.public.dappnode.eth",
                  description: "Besu execution client",
                  shortDescription: "Besu execution client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "erigon.dnp.dappnode.eth" as ExecutionClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "erigon.dnp.dappnode.eth",
                  description: "Erigon execution client",
                  shortDescription: "Erigon execution client",
                  version: "0.1.0"
                }
              }
            }
          ],
          consensusClients: [
            {
              status: "ok",
              dnpName: "prysm.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: true,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "prysm.dnp.dappnode.eth",
                  description: "Prysm consensus client",
                  shortDescription: "Prysm consensus client",
                  version: "0.1.0"
                }
              },
              graffiti: "Validating_from_prysm-mainnet",
              feeRecipient: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
              checkpointSync: "https://checkpoint-sync.dappnode.io"
            },
            {
              status: "ok",
              dnpName: "lighthouse.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "lighthouse.dnp.dappnode.eth",
                  description: "Lighthouse consensus client",
                  shortDescription: "Lighthouse consensus client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "teku.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "teku.dnp.dappnode.eth",
                  description: "Teku consensus client",
                  shortDescription: "Teku consensus client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "nimbus.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,
                metadata: {
                  name: "nimbus.dnp.dappnode.eth",
                  description: "Nimbus consensus client",
                  shortDescription: "Nimbus consensus client",
                  version: "0.1.0"
                }
              },
              graffiti: "Validating_from_prysm-nimbus",
              feeRecipient: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
              checkpointSync: "https://checkpoint-sync.dappnode.io"
            }
          ],
          web3Signer: {
            status: "ok",
            dnpName: "web3signer.dnp.dappnode.eth" as Signer<T>,
            isInstalled: true,
            isRunning: true,
            isUpdated: true,
            isSelected: true,
            avatarUrl: "",
            data: {
              dnpName: "package",
              reqVersion: "0.1.0",
              semVersion: "0.1.0",
              imageFile: {
                hash: "QM..",
                source: "ipfs",
                size: 123
              },
              warnings: {},
              signedSafe: true,
              metadata: {
                name: "web3signer.dnp.dappnode.eth",
                description: "Web3Signer",
                shortDescription: "Web3Signer",
                version: "0.1.},0"
              }
            }
          },
          mevBoost: {
            status: "ok",
            dnpName: "mev-boost.dnp.dappnode.eth" as MevBoost<T>,
            isInstalled: true,
            isRunning: true,
            isUpdated: true,
            isSelected: true,
            avatarUrl: "",
            relays: [
              "https://0x8f7b17a74569b7a57e9bdafd2e159380759f5dc3ccbd4bf600414147e8c4e1dc6ebada83c0139ac15850eb6c975e82d0@builder-relay-goerli.blocknative.com",
              "https://0xb1d229d9c21298a87846c7022ebeef277dfc321fe674fa45312e20b5b6c400bfde9383f801848d7837ed5fc449083a12@relay-goerli.edennetwork.io",
              "https://0x8a72a5ec3e2909fff931c8b42c9e0e6c6e660ac48a98016777fc63a73316b3ffb5c622495106277f8dbcc17a06e92ca3@goerli-relay.securerpc.com/"
            ],
            data: {
              dnpName: "package",
              reqVersion: "0.1.0",
              semVersion: "0.1.0",
              imageFile: {
                hash: "QM..",
                source: "ipfs",
                size: 123
              },
              warnings: {},
              signedSafe: true,
              metadata: {
                name: "mevboost.dnp.dappnode.eth",
                description: "MEV Boost",
                shortDescription: "MEV Boost",
                version: "0.1.},0"
              }
            }
          }
        };

      case "prater":
        return {
          executionClients: [
            {
              status: "ok",
              dnpName: "goerli-geth.dnp.dappnode.eth" as ExecutionClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,
                metadata: {
                  name: "geth.dnp.dappnode.eth",
                  description: "Geth execution client",
                  shortDescription: "Geth execution client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "goerli-nethermind.dnp.dappnode.eth" as ExecutionClient<
                T
              >,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "nethermind.dnp.dappnode.eth",
                  description: "Nethermind execution client",
                  shortDescription: "Nethermind execution client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "goerli-besu.dnp.dappnode.eth" as ExecutionClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: false,
              isSelected: true,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,
                metadata: {
                  name: "besu.dnp.dappnode.eth",
                  description: "Besu execution client",
                  shortDescription: "Besu execution client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "goerli-erigon.dnp.dappnode.eth" as ExecutionClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "erigon.dnp.dappnode.eth",
                  description: "Erigon execution client",
                  shortDescription: "Erigon execution client",
                  version: "0.1.0"
                }
              }
            }
          ],
          consensusClients: [
            {
              status: "ok",
              dnpName: "prysm-prater.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: true,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "prysm.dnp.dappnode.eth",
                  description: "Prysm consensus client",
                  shortDescription: "Prysm consensus client",
                  version: "0.1.0"
                }
              },
              graffiti: "Validating_from_prysm-prater",
              feeRecipient: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
              checkpointSync: "https://checkpoint-sync-prater.dappnode.io"
            },
            {
              status: "ok",
              dnpName: "lighthouse-prater.dnp.dappnode.eth" as ConsensusClient<
                T
              >,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "lighthouse.dnp.dappnode.eth",
                  description: "Lighthouse consensus client",
                  shortDescription: "Lighthouse consensus client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "teku-prater.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: false,
              isRunning: false,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "teku.dnp.dappnode.eth",
                  description: "Teku consensus client",
                  shortDescription: "Teku consensus client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "nimbus-prater.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,
                metadata: {
                  name: "nimbus.dnp.dappnode.eth",
                  description: "Nimbus consensus client",
                  shortDescription: "Nimbus consensus client",
                  version: "0.1.0"
                }
              },
              graffiti: "Validating_from_prysm-nimbus",
              feeRecipient: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
              checkpointSync: "https://checkpoint-sync.dappnode.io"
            }
          ],
          web3Signer: {
            status: "ok",
            dnpName: "web3signer-prater.dnp.dappnode.eth" as Signer<T>,
            isInstalled: true,
            isRunning: true,
            isUpdated: true,
            isSelected: true,
            avatarUrl: "",
            data: {
              dnpName: "package",
              reqVersion: "0.1.0",
              semVersion: "0.1.0",
              imageFile: {
                hash: "QM..",
                source: "ipfs",
                size: 123
              },
              warnings: {},
              signedSafe: true,
              metadata: {
                name: "web3signer.dnp.dappnode.eth",
                description: "Web3Signer",
                shortDescription: "Web3Signer",
                version: "0.1.0"
              },
              links: {
                ui: "http://web3signer-prater.dappnode:9000"
              }
            }
          },
          mevBoost: {
            status: "ok",
            dnpName: "mev-boost-goerli.dnp.dappnode.eth" as MevBoost<T>,
            isInstalled: true,
            isRunning: true,
            isUpdated: true,
            isSelected: true,
            avatarUrl: "",
            relays: [
              "https://0x8f7b17a74569b7a57e9bdafd2e159380759f5dc3ccbd4bf600414147e8c4e1dc6ebada83c0139ac15850eb6c975e82d0@builder-relay-goerli.blocknative.com",
              "https://0xb1d229d9c21298a87846c7022ebeef277dfc321fe674fa45312e20b5b6c400bfde9383f801848d7837ed5fc449083a12@relay-goerli.edennetwork.io",
              "https://0x8a72a5ec3e2909fff931c8b42c9e0e6c6e660ac48a98016777fc63a73316b3ffb5c622495106277f8dbcc17a06e92ca3@goerli-relay.securerpc.com/"
            ],
            data: {
              dnpName: "package",
              reqVersion: "0.1.0",
              semVersion: "0.1.0",
              imageFile: {
                hash: "QM..",
                source: "ipfs",
                size: 123
              },
              warnings: {},
              signedSafe: true,
              metadata: {
                name: "mevboost.dnp.dappnode.eth",
                description: "MEV Boost",
                shortDescription: "MEV Boost",
                version: "0.1.},0"
              }
            }
          }
        };
      case "gnosis":
        return {
          executionClients: [
            {
              status: "ok",
              dnpName: "nethermind-xdai.dnp.dappnode.eth" as ExecutionClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: true,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "geth.dnp.dappnode.eth",
                  description: "Geth execution client",
                  shortDescription: "Geth execution client",
                  version: "0.1.0"
                }
              }
            }
          ],
          consensusClients: [
            {
              status: "ok",
              dnpName: "gnosis-beacon-chain-prysm.dnp.dappnode.eth" as ConsensusClient<
                T
              >,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: true,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "prysm.dnp.dappnode.eth",
                  description: "Prysm consensus client",
                  shortDescription: "Prysm consensus client",
                  version: "0.1.0"
                }
              },
              graffiti: "Validating_from_prysm-mainnet",
              feeRecipient: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
              checkpointSync: "https://checkpoint-sync.dappnode.io"
            },
            {
              status: "ok",
              dnpName: "lighthouse-gnosis.dnp.dappnode.eth" as ConsensusClient<
                T
              >,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,
                metadata: {
                  name: "lighthouse.dnp.dappnode.eth",
                  description: "Lighthouse consensus client",
                  shortDescription: "Lighthouse consensus client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "teku-gnosis.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "teku.dnp.dappnode.eth",
                  description: "Teku consensus client",
                  shortDescription: "Teku consensus client",
                  version: "0.1.0"
                }
              }
            },
            {
              status: "ok",
              dnpName: "nimbus-gnosis.dnp.dappnode.eth" as ConsensusClient<T>,
              isInstalled: true,
              isRunning: true,
              isUpdated: true,
              isSelected: false,
              avatarUrl: "",
              data: {
                dnpName: "package",
                reqVersion: "0.1.0",
                semVersion: "0.1.0",
                imageFile: {
                  hash: "QM..",
                  source: "ipfs",
                  size: 123
                },
                warnings: {},
                signedSafe: true,

                metadata: {
                  name: "nimbus.dnp.dappnode.eth",
                  description: "Nimbus consensus client",
                  shortDescription: "Nimbus consensus client",
                  version: "0.1.0"
                }
              },
              graffiti: "Validating_from_prysm-nimbus",
              feeRecipient: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
              checkpointSync: "https://checkpoint-sync.dappnode.io"
            }
          ],
          web3Signer: {
            status: "ok",
            dnpName: "web3signer-gnosis.dnp.dappnode.eth" as Signer<T>,
            isInstalled: true,
            isRunning: true,
            isUpdated: true,
            isSelected: true,
            avatarUrl: "",
            data: {
              dnpName: "package",
              reqVersion: "0.1.0",
              semVersion: "0.1.0",
              imageFile: {
                hash: "QM..",
                source: "ipfs",
                size: 123
              },
              warnings: {},
              signedSafe: true,
              metadata: {
                name: "web3signer.dnp.dappnode.eth",
                description: "Web3Signer",
                shortDescription: "Web3Signer",
                version: "0.1.},0"
              }
            }
          },
          mevBoost: {
            status: "ok",
            dnpName: "mev-boost-gnosis.dnp.dappnode.eth" as MevBoost<T>,
            isInstalled: true,
            isRunning: true,
            isUpdated: true,
            isSelected: true,
            avatarUrl: "",
            relays: [
              "https://0x8f7b17a74569b7a57e9bdafd2e159380759f5dc3ccbd4bf600414147e8c4e1dc6ebada83c0139ac15850eb6c975e82d0@builder-relay-goerli.blocknative.com",
              "https://0xb1d229d9c21298a87846c7022ebeef277dfc321fe674fa45312e20b5b6c400bfde9383f801848d7837ed5fc449083a12@relay-goerli.edennetwork.io",
              "https://0x8a72a5ec3e2909fff931c8b42c9e0e6c6e660ac48a98016777fc63a73316b3ffb5c622495106277f8dbcc17a06e92ca3@goerli-relay.securerpc.com/"
            ],
            data: {
              dnpName: "package",
              reqVersion: "0.1.0",
              semVersion: "0.1.0",
              imageFile: {
                hash: "QM..",
                source: "ipfs",
                size: 123
              },
              warnings: {},
              signedSafe: true,
              metadata: {
                name: "mevboost.dnp.dappnode.eth",
                description: "MEV Boost",
                shortDescription: "MEV Boost",
                version: "0.1.},0"
              }
            }
          }
        };
      default:
        throw Error(`Unknown network ${network}`);
    }
  }
};
