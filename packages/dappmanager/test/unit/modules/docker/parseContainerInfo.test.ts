import "mocha";
import { expect } from "chai";
import { PackageContainer, PortProtocol } from "@dappnode/common";
import {
  parseContainerInfo,
  parseDnpNameFromContainerName
} from "../../../../src/modules/docker/list/parseContainerInfo";
import { dockerApiResponseContainers } from "./dockerApiSamples/containers";

describe("modules / docker / parseDnpNameFromContainerName", () => {
  const testCases = {
    "DAppNodeCore-api.wireguard.dnp.dappnode.eth": "wireguard.dnp.dappnode.eth",
    "DAppNodePackage-geth.dnp.dappnode.eth": "geth.dnp.dappnode.eth"
  };

  for (const [containerName, dnpName] of Object.entries(testCases)) {
    it(containerName, () => {
      expect(parseDnpNameFromContainerName(containerName)).to.equal(dnpName);
    });
  }
});

describe("modules / docker / parseContainerInfo", function () {
  it("should parse docker containers", async () => {
    const containers = dockerApiResponseContainers.map(parseContainerInfo);
    // console.log(JSON.stringify(containers, null, 2));

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
            protocol: PortProtocol.TCP,
            deletable: true
          }
        ],
        volumes: [],
        networks: [{ name: "dncore_network", ip: "172.33.0.9" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest",
          "letsencrypt-nginx.dnp.dappnode.eth": "latest"
        },
        defaultPorts: [],
        avatarUrl: "",
        canBeFullnode: false
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
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            host: 80,
            container: 80,
            protocol: PortProtocol.TCP,
            deletable: true
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
            name: "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b"
          },
          {
            host: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
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
        networks: [{ name: "dncore_network", ip: "172.33.0.6" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
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
            host: "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
            container: "/app/.ethchain",
            name: "dncore_ethchaindnpdappnodeeth_data"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.0.5" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
      },
      {
        containerId:
          "539c5a2a32342365867689478b540d8d75c23d2dc1700bbed3b6171d754bb890",
        containerName: "DAppNodeCore-wifi.dnp.dappnode.eth",
        serviceName: "wifi.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "wifi.dnp.dappnode.eth",
        version: "0.2.0",
        isDnp: false,
        isCore: true,
        created: 1560354278,
        image: "wifi.dnp.dappnode.eth:0.2.0",
        ip: "",
        ports: [],
        volumes: [
          {
            host: "/var/run/docker.sock",
            container: "/var/run/docker.sock"
          }
        ],
        networks: [{ name: "dncore_network", ip: "" }],
        state: "exited",
        running: false,
        exitCode: 137,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
      },
      {
        containerId:
          "02b71c411d1d2e503afad679ab1c16a3e5cf086d5a298476fb30548b62d716f0",
        containerName: "DAppNodeCore-admin.dnp.dappnode.eth",
        serviceName: "admin.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "admin.dnp.dappnode.eth",
        version: "0.2.3",
        isDnp: false,
        isCore: true,
        created: 1560335154,
        image: "admin.dnp.dappnode.eth:0.2.3",
        ip: "172.33.1.9",
        ports: [
          {
            host: 8090,
            container: 8090,
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            container: 80,
            protocol: PortProtocol.TCP,
            deletable: true
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_shared/_data",
            container: "/usr/www/openvpn/cred",
            name: "dncore_vpndnpdappnodeeth_shared"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.1.9" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
      },
      {
        containerId:
          "514b892b5e537f77515ee3278915a5fd1bf80228e8df6ed64b35c1a0fbdfbec0",
        containerName: "DAppNodeCore-vpn.dnp.dappnode.eth",
        serviceName: "vpn.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "vpn.dnp.dappnode.eth",
        version: "0.2.0",
        isDnp: false,
        isCore: true,
        created: 1560334861,
        image: "vpn.dnp.dappnode.eth:0.2.0",
        ip: "172.33.1.4",
        ports: [
          {
            host: 1194,
            container: 1194,
            protocol: PortProtocol.UDP,
            deletable: true
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_config/_data",
            container: "/etc/openvpn",
            name: "dncore_vpndnpdappnodeeth_config"
          },
          {
            host: "/etc/hostname",
            container: "/etc/vpnname"
          },
          {
            host: "/lib/modules",
            container: "/lib/modules"
          },
          {
            host: "/usr/src/dappnode/config",
            container: "/usr/src/app/config"
          },
          {
            host: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data",
            container: "/usr/src/app/secrets",
            name: "dncore_vpndnpdappnodeeth_data"
          },
          {
            host: "/var/run/docker.sock",
            container: "/var/run/docker.sock"
          },
          {
            host: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_shared/_data",
            container: "/var/spool/openvpn",
            name: "dncore_vpndnpdappnodeeth_shared"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.1.4" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
      },
      {
        containerId:
          "51eaaba5c184da5605bf5ce1af4026592cdb3be1d6ff209a5cf0e3cf09c3f6a4",
        containerName: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
        serviceName: "dappmanager.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "dappmanager.dnp.dappnode.eth",
        version: "0.2.3",
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "dappmanager.dnp.dappnode.eth:0.2.3",
        ip: "172.33.1.7",
        ports: [],
        volumes: [
          {
            host: "/usr/src/dappnode/DNCORE",
            container: "/usr/src/app/DNCORE"
          },
          {
            host: "/var/lib/docker/volumes/dncore_dappmanagerdnpdappnodeeth_data/_data",
            container: "/usr/src/app/dnp_repo",
            name: "dncore_dappmanagerdnpdappnodeeth_data"
          },
          {
            host: "/var/run/docker.sock",
            container: "/var/run/docker.sock"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.1.7" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
      },
      {
        containerId:
          "3dd5e6cd5756b7349636515bb0f50f3c9e35d75909ab9dfcb9c76cb9e54ab9c7",
        containerName: "DAppNodeCore-bind.dnp.dappnode.eth",
        serviceName: "bind.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "bind.dnp.dappnode.eth",
        version: "0.2.0",
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "bind.dnp.dappnode.eth:0.2.0",
        ip: "172.33.1.2",
        ports: [
          {
            container: 53,
            protocol: PortProtocol.UDP,
            deletable: true
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/dncore_binddnpdappnodeeth_data/_data",
            container: "/etc/bind",
            name: "dncore_binddnpdappnodeeth_data"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.1.2" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
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
            protocol: PortProtocol.TCP,
            deletable: false
          },
          {
            host: 30303,
            container: 30303,
            protocol: PortProtocol.UDP,
            deletable: false
          },
          {
            host: 30304,
            container: 30304,
            protocol: PortProtocol.UDP,
            deletable: false
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
            container: "/root/.local/share/io.parity.ethereum",
            name: "dncore_ethchaindnpdappnodeeth_data"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.1.6" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "/ipfs/QmQnHxr4YAVdtqzHnsDYvmXizxptSYyaj3YwTjoiLshVwF",
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
            protocol: PortProtocol.TCP
          },
          {
            host: 30303,
            container: 30303,
            protocol: PortProtocol.UDP
          },
          {
            host: 30304,
            container: 30304,
            protocol: PortProtocol.UDP
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
          "a4ae8b09bc9b2037ff76f99436ddf1890e1215c2a17533ab73445726b41b2bef",
        containerName: "DAppNodeCore-ipfs.dnp.dappnode.eth",
        serviceName: "ipfs.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "ipfs.dnp.dappnode.eth",
        version: "0.2.2",
        isDnp: false,
        isCore: true,
        created: 1560334697,
        image: "ipfs.dnp.dappnode.eth:0.2.2",
        ip: "172.33.1.5",
        ports: [
          {
            container: 5001,
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            container: 8080,
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            container: 8081,
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            host: 4001,
            container: 4001,
            protocol: PortProtocol.TCP,
            deletable: false
          },
          {
            host: 4002,
            container: 4002,
            protocol: PortProtocol.UDP,
            deletable: false
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_data/_data",
            container: "/data/ipfs",
            name: "dncore_ipfsdnpdappnodeeth_data"
          },
          {
            host: "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_export/_data",
            container: "/export",
            name: "dncore_ipfsdnpdappnodeeth_export"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.1.5" }],
        state: "running",
        running: true,
        exitCode: null,
        defaultPorts: [
          {
            container: 4001,
            host: 4001,
            protocol: PortProtocol.TCP
          },
          {
            container: 4002,
            host: 4002,
            protocol: PortProtocol.UDP
          }
        ],
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
      },
      {
        containerId:
          "12cf3e376374f665d05a78bb20641cd9d5e36b7ab418b0ebec7c77b6798156c0",
        containerName: "DAppNodeCore-ethforward.dnp.dappnode.eth",
        serviceName: "ethforward.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "ethforward.dnp.dappnode.eth",
        version: "0.2.1",
        isDnp: false,
        isCore: true,
        created: 1560334412,
        image: "ethforward.dnp.dappnode.eth:0.2.1",
        ip: "172.33.1.3",
        ports: [],
        volumes: [],
        networks: [{ name: "dncore_network", ip: "172.33.1.3" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
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
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            host: 30399,
            container: 30399,
            protocol: PortProtocol.UDP,
            deletable: true
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/swarmdnpdappnodeeth_swarm/_data",
            container: "/root/.ethereum",
            name: "swarmdnpdappnodeeth_swarm"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.0.7" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
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
            host: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
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
        networks: [{ name: "dncore_network", ip: "172.33.0.8" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest"
        },
        avatarUrl: "",
        canBeFullnode: false
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
            host: "/var/lib/docker/volumes/ipfsreplicatordnpdappnodeeth_pin-data/_data",
            container: "/usr/src/app/data",
            name: "ipfsreplicatordnpdappnodeeth_pin-data"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.0.4" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        origin: "/ipfs/QmYfVW2LNHH8ZXa6KJmfFAz5zCQ8YHh2ZPt6aQmezJcbL7",
        canBeFullnode: false
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
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            host: 32771,
            container: 30303,
            protocol: PortProtocol.UDP,
            deletable: true
          },
          {
            host: 32770,
            container: 30304,
            protocol: PortProtocol.UDP,
            deletable: true
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/goerligethdnpdappnodeeth_goerli/_data",
            container: "/goerli",
            name: "goerligethdnpdappnodeeth_goerli"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.0.3" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        chain: "ethereum",
        canBeFullnode: false
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
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            host: 9735,
            container: 9735,
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            container: 10009,
            protocol: PortProtocol.TCP,
            deletable: true
          }
        ],
        volumes: [
          {
            host: "/var/lib/docker/volumes/lndnpdappnodeeth_lndconfig_data/_data",
            container: "/root/.lnd",
            name: "lndnpdappnodeeth_lndconfig_data"
          }
        ],
        networks: [{ name: "dncore_network", ip: "172.33.0.2" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {
          "bitcoin.dnp.dappnode.eth": "latest"
        },
        avatarUrl: "",
        canBeFullnode: false
      },
      {
        containerId:
          "d01badf202548868538e0435163e66a12f5bbb253e82150ed951e89a4c13690d",
        containerName: "DAppNodeCore-wamp.dnp.dappnode.eth",
        serviceName: "wamp.dnp.dappnode.eth",
        instanceName: "",
        dnpName: "wamp.dnp.dappnode.eth",
        version: "0.2.0",
        isDnp: false,
        isCore: true,
        created: 1557330387,
        image: "wamp.dnp.dappnode.eth:0.2.0",
        ip: "172.33.1.8",
        ports: [
          {
            container: 8000,
            protocol: PortProtocol.TCP,
            deletable: true
          },
          {
            container: 8080,
            protocol: PortProtocol.TCP,
            deletable: true
          }
        ],
        volumes: [],
        networks: [{ name: "dncore_network", ip: "172.33.1.8" }],
        state: "running",
        running: true,
        exitCode: null,
        dependencies: {},
        avatarUrl: "",
        canBeFullnode: false
      },
      {
        avatarUrl: "/ipfs/QmaZZVsVqaWwVLe36HhvKj3QEPt7hM1GL8kemNvsZd5F5x",
        canBeFullnode: false,
        containerId:
          "ba4765113dd6016da8b35dfe367493186f3bfd34d88eca03ccf894f7045710fa",
        containerName: "DAppNodePackage-grafana.dms.dnp.dappnode.eth",
        created: 1618303536,
        defaultVolumes: [
          {
            container: "/var/lib/grafana",
            host: "grafana_data",
            name: "grafana_data"
          }
        ],
        dependencies: {},
        dnpName: "dms.dnp.dappnode.eth",
        exitCode: null,
        image: "grafana.dms.dnp.dappnode.eth:1.0.1",
        instanceName: "",
        ip: "172.33.0.3",
        isCore: false,
        isDnp: true,
        isMain: true,
        networks: [
          {
            ip: "172.33.0.3",
            name: "dncore_network"
          }
        ],
        ports: [
          {
            container: 3000,
            deletable: true,

            protocol: PortProtocol.TCP
          }
        ],
        running: true,
        serviceName: "grafana",
        state: "running",
        version: "1.0.1",
        volumes: [
          {
            container: "/var/lib/grafana",
            host: "/var/lib/docker/volumes/dmsdnpdappnodeeth_grafana_data/_data",
            name: "dmsdnpdappnodeeth_grafana_data"
          }
        ]
      }
    ];

    // Remove all values that are undefined
    const containersClean = JSON.parse(JSON.stringify(containers));
    expect(containersClean).to.deep.equal(expectedContainers);
  });
});
