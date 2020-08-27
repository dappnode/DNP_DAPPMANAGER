import "mocha";
import { expect } from "chai";
import { PackageContainer } from "../../../src/types";
import Docker from "dockerode";
import rewiremock from "rewiremock";
// Imports for typing
import { listContainers as listContainersType } from "../../../src/modules/docker/listContainers";

import { dockerApiResponseContainers } from "./dockerApiSamples/containers";

describe("listContainers", function() {
  async function dockerList(): Promise<Docker.ContainerInfo[]> {
    return dockerApiResponseContainers;
  }

  let listContainers: typeof listContainersType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../../src/modules/docker/listContainers"),
      mock => {
        mock(() => import("../../../src/modules/docker/dockerApi"))
          .with({ dockerList })
          .toBeUsed();
      }
    );
    listContainers = mock.listContainers;
  });

  it("should parse an entire listContainers", async () => {
    const containers = await listContainers();
    console.log(JSON.stringify(containers, null, 2));

    const expectedContainers: PackageContainer[] = [
      {
        containerId:
          "5407d28e2cca82b4e83351b2f55d07469703223e2296934f5034a8922e99d76d",
        containerName: "DAppNodePackage-otpweb.dnp.dappnode.eth",
        serviceName: "otpweb.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "otpweb.dnp.dappnode.eth",
        version: "0.0.3",
        isDnp: true,
        isCore: false,
        created: 1560420780,
        image: "otpweb.dnp.dappnode.eth:0.0.3",
        ip: "172.33.0.9",
        ports: [
          {
            container: 80,
            protocol: "TCP",
            deletable: false
          }
        ],
        volumes: [],
        state: "running",
        running: true,
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest",
          "letsencrypt-nginx.dnp.dappnode.eth": "latest"
        },
        avatarUrl: "",
        origin: "",
        canBeFullnode: false,
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: []
      },
      {
        containerId:
          "8a382e9a3b8ac449388470d06b98486b4fc965980fc5b72fd1c1cc77ae070484",
        containerName: "DAppNodePackage-nginx-proxy.dnp.dappnode.eth",
        serviceName: "nginx-proxy.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "nginx-proxy.dnp.dappnode.eth",
        version: "0.0.3",
        isDnp: true,
        isCore: false,
        created: 1560420777,
        image: "nginx-proxy.dnp.dappnode.eth:0.0.3",
        ip: "172.33.0.6",
        ports: [
          {
            host: 443,
            container: 443,
            protocol: "TCP",
            deletable: false
          },
          {
            host: 80,
            container: 80,
            protocol: "TCP",
            deletable: false
          }
        ],
        volumes: [
          {
            host: "/root/certs",
            container: "/etc/nginx/certs"
          },
          {
            host: "",
            container: "/etc/nginx/dhparam",
            name:
              "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b"
          },
          {
            host:
              "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
            container: "/etc/nginx/vhost.d",
            name: "nginxproxydnpdappnodeeth_vhost.d"
          },
          {
            host: "/var/run/docker.sock",
            container: "/tmp/docker.sock"
          },
          {
            host: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
            container: "/usr/share/nginx/html",
            name: "nginxproxydnpdappnodeeth_html"
          }
        ],
        state: "running",
        running: true,
        dependencies: {},
        avatarUrl: "",
        origin: "",
        canBeFullnode: false,
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: []
      },
      {
        containerId:
          "951426e3fa2cbfd49a5198840764383af3961c2b29ba33a6b5f3dd45b953db9f",
        containerName: "DAppNodePackage-vipnode.dnp.dappnode.eth",
        serviceName: "vipnode.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "vipnode.dnp.dappnode.eth",
        version: "0.0.2",
        isDnp: true,
        isCore: false,
        created: 1560369616,
        image: "vipnode.dnp.dappnode.eth:0.0.2",
        ip: "172.33.0.5",
        ports: [],
        volumes: [
          {
            host:
              "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
            container: "/app/.ethchain",
            name: "dncore_ethchaindnpdappnodeeth_data"
          }
        ],
        state: "running",
        running: true,
        dependencies: {},
        avatarUrl: "",
        origin: "",
        canBeFullnode: false,
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: []
      },
      {
        containerId:
          "e1766fd7a9d8110398b66c7b0f68fe625ee856f49526b987a54537028448476b",
        containerName: "DAppNodeCore-ethchain.dnp.dappnode.eth",
        serviceName: "ethchain.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "ethchain.dnp.dappnode.eth",
        version: "0.2.1",
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "ethchain.dnp.dappnode.eth:0.2.1",
        ip: "172.33.1.6",
        ports: [
          {
            host: 30303,
            container: 30303,
            protocol: "TCP",
            deletable: false
          },
          {
            host: 30303,
            container: 30303,
            protocol: "UDP",
            deletable: false
          },
          {
            host: 30304,
            container: 30304,
            protocol: "UDP",
            deletable: false
          }
        ],
        volumes: [
          {
            host:
              "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
            container: "/root/.local/share/io.parity.ethereum",
            name: "dncore_ethchaindnpdappnodeeth_data"
          }
        ],
        state: "running",
        running: true,
        dependencies: {},
        avatarUrl:
          "http://ipfs.dappnode:8080/ipfs/QmQnHxr4YAVdtqzHnsDYvmXizxptSYyaj3YwTjoiLshVwF",
        origin: "/ipfs/QmeBfnwgsNcEmbmxENBWtgkv5YZsAhiaDsoYd7nMTV1wKV",
        chain: "ethereum",
        canBeFullnode: false,
        defaultEnvironment: {
          EXTRA_OPTS: "--warp-barrier 8540000",
          EXTRA_OPTS_GETH: "",
          DEFAULT_CLIENT: "PARITY"
        },
        defaultPorts: [
          {
            host: 30303,
            container: 30303,
            protocol: "TCP"
          },
          {
            host: 30303,
            container: 30303,
            protocol: "UDP"
          },
          {
            host: 30304,
            container: 30304,
            protocol: "UDP"
          }
        ],
        defaultVolumes: [
          {
            host: "ethchaindnpdappnodeeth_data",
            container: "/root/.local/share/io.parity.ethereum",
            name: "ethchaindnpdappnodeeth_data"
          },
          {
            host: "ethchaindnpdappnodeeth_geth",
            container: "/root/.ethereum",
            name: "ethchaindnpdappnodeeth_geth"
          },
          {
            host: "ethchaindnpdappnodeeth_identity",
            container: "/root/identity",
            name: "ethchaindnpdappnodeeth_identity"
          }
        ]
      },
      {
        containerId:
          "f789e9b7f00d7292c0db1f83b4dac063ce4a84d2bb3d55d12f9f492b7cbcbb2c",
        containerName: "DAppNodePackage-swarm.dnp.dappnode.eth",
        serviceName: "swarm.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "swarm.dnp.dappnode.eth",
        version: "0.1.0",
        isDnp: true,
        isCore: false,
        created: 1558708223,
        image: "swarm.dnp.dappnode.eth:0.1.0",
        ip: "172.33.0.7",
        ports: [
          {
            host: 30399,
            container: 30399,
            protocol: "TCP",
            deletable: false
          },
          {
            host: 30399,
            container: 30399,
            protocol: "UDP",
            deletable: false
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/swarmdnpdappnodeeth_swarm/_data",
            container: "/root/.ethereum",
            name: "swarmdnpdappnodeeth_swarm"
          }
        ],
        state: "running",
        running: true,
        dependencies: {},
        avatarUrl: "",
        origin: "",
        canBeFullnode: false,
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: []
      },
      {
        containerId:
          "b7f32fcefcd4bfb34d0c293378993e4a40eb3e62d8a928c4f183065834a10fb2",
        containerName: "DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth",
        serviceName: "letsencrypt-nginx.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "letsencrypt-nginx.dnp.dappnode.eth",
        version: "0.0.4",
        isDnp: true,
        isCore: false,
        created: 1558377639,
        image: "letsencrypt-nginx.dnp.dappnode.eth:0.0.4",
        ip: "172.33.0.8",
        ports: [],
        volumes: [
          {
            host: "/root/certs",
            container: "/etc/nginx/certs"
          },
          {
            host:
              "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
            container: "/etc/nginx/vhost.d",
            name: "nginxproxydnpdappnodeeth_vhost.d"
          },
          {
            host: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
            container: "/usr/share/nginx/html",
            name: "nginxproxydnpdappnodeeth_html"
          },
          {
            host: "/var/run/docker.sock",
            container: "/var/run/docker.sock"
          }
        ],
        state: "running",
        running: true,
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest"
        },
        avatarUrl: "",
        origin: "",
        canBeFullnode: false,
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: []
      },
      {
        containerId:
          "c944a1549ba675b7229b55370cfd2f54dca1f86050fbef7df4ba453398f93c24",
        containerName: "DAppNodePackage-ipfs-replicator.dnp.dappnode.eth",
        serviceName: "ipfs-replicator.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "ipfs-replicator.dnp.dappnode.eth",
        version: "0.1.0",
        isDnp: true,
        isCore: false,
        created: 1558258487,
        image: "ipfs-replicator.dnp.dappnode.eth:0.1.0",
        ip: "172.33.0.4",
        ports: [],
        volumes: [
          {
            host:
              "/var/lib/docker/volumes/ipfsreplicatordnpdappnodeeth_pin-data/_data",
            container: "/usr/src/app/data",
            name: "ipfsreplicatordnpdappnodeeth_pin-data"
          }
        ],
        state: "running",
        running: true,
        dependencies: {},
        avatarUrl: "",
        origin: "/ipfs/QmYfVW2LNHH8ZXa6KJmfFAz5zCQ8YHh2ZPt6aQmezJcbL7",
        canBeFullnode: false,
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: []
      },
      {
        containerId:
          "ffc3f4ed380ad42b7f847228862ad4de4ab471229bb5e1ed0aef46d4561309d2",
        containerName: "DAppNodePackage-goerli-geth.dnp.dappnode.eth",
        serviceName: "goerli-geth.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "goerli-geth.dnp.dappnode.eth",
        version: "0.2.2",
        isDnp: true,
        isCore: false,
        created: 1558258483,
        image: "goerli-geth.dnp.dappnode.eth:0.2.2",
        ip: "172.33.0.3",
        ports: [
          {
            host: 32769,
            container: 30303,
            protocol: "TCP",
            deletable: false
          },
          {
            host: 32771,
            container: 30303,
            protocol: "UDP",
            deletable: false
          },
          {
            host: 32770,
            container: 30304,
            protocol: "UDP",
            deletable: false
          }
        ],
        volumes: [
          {
            host:
              "/var/lib/docker/volumes/goerligethdnpdappnodeeth_goerli/_data",
            container: "/goerli",
            name: "goerligethdnpdappnodeeth_goerli"
          }
        ],
        state: "running",
        running: true,
        dependencies: {},
        avatarUrl: "",
        origin: "",
        chain: "ethereum",
        canBeFullnode: false,
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: []
      },
      {
        containerId:
          "94bde8655e2d8daca033486ef46e7d270c4f4b6f6c18b820d80c2cbf211130bd",
        containerName: "DAppNodePackage-ln.dnp.dappnode.eth",
        serviceName: "ln.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "ln.dnp.dappnode.eth",
        version: "0.1.1",
        isDnp: true,
        isCore: false,
        created: 1558258481,
        image: "ln.dnp.dappnode.eth:0.1.1",
        ip: "172.33.0.2",
        ports: [
          {
            container: 80,
            protocol: "TCP",
            deletable: false
          },
          {
            host: 9735,
            container: 9735,
            protocol: "TCP",
            deletable: false
          },
          {
            container: 10009,
            protocol: "TCP",
            deletable: false
          }
        ],
        volumes: [
          {
            host:
              "/var/lib/docker/volumes/lndnpdappnodeeth_lndconfig_data/_data",
            container: "/root/.lnd",
            name: "lndnpdappnodeeth_lndconfig_data"
          }
        ],
        state: "running",
        running: true,
        dependencies: {
          "bitcoin.dnp.dappnode.eth": "latest"
        },
        avatarUrl: "",
        origin: "",
        canBeFullnode: false,
        defaultEnvironment: {},
        defaultPorts: [],
        defaultVolumes: []
      }
    ];

    // Remove all values that are undefined
    const containersClean = JSON.parse(JSON.stringify(containers));
    expect(containersClean).to.deep.equal(expectedContainers);
  });
});
