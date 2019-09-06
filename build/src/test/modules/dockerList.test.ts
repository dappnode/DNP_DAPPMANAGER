import "mocha";
import { expect } from "chai";
import { PackageContainer } from "../../src/types";
const proxyquire = require("proxyquire").noCallThru();

const dockerApiResponseContainers = require("./dockerApiSamples/containers.json");

describe("dockerList", function() {
  const { default: listContainers } = proxyquire(
    "../../src/modules/listContainers",
    {
      "./dockerApi": {
        dockerApi: {
          // I can't access to the original type of dockerode, and it's pointless to type
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          listContainers: async (): Promise<any> => dockerApiResponseContainers
        }
      }
    }
  );

  it("should parse an entire listContainers", async () => {
    const dnpList = await listContainers();

    const expectedDnpList: PackageContainer[] = [
      {
        id: "5407d28e2cca82b4e83351b2f55d07469703223e2296934f5034a8922e99d76d",
        packageName: "DAppNodePackage-otpweb.dnp.dappnode.eth",
        version: "0.0.3",
        isDnp: true,
        isCore: false,
        created: 1560420780,
        image: "otpweb.dnp.dappnode.eth:0.0.3",
        name: "otpweb.dnp.dappnode.eth",
        shortName: "otpweb",
        ports: [
          {
            container: 80,
            protocol: "TCP"
          }
        ],
        volumes: [],
        state: "running",
        running: true,
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest",
          "letsencrypt-nginx.dnp.dappnode.eth": "latest"
        }
      },
      {
        id: "8a382e9a3b8ac449388470d06b98486b4fc965980fc5b72fd1c1cc77ae070484",
        packageName: "DAppNodePackage-nginx-proxy.dnp.dappnode.eth",
        version: "0.0.3",
        isDnp: true,
        isCore: false,
        created: 1560420777,
        image: "nginx-proxy.dnp.dappnode.eth:0.0.3",
        name: "nginx-proxy.dnp.dappnode.eth",
        shortName: "nginx-proxy",
        ports: [
          {
            host: 443,
            container: 443,
            protocol: "TCP"
          },
          {
            host: 80,
            container: 80,
            protocol: "TCP"
          }
        ],
        volumes: [
          {
            path: "/root/certs",
            dest: "/etc/nginx/certs"
          },
          {
            path: "",
            dest: "/etc/nginx/dhparam",
            name:
              "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
            users: ["nginx-proxy.dnp.dappnode.eth"],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          },
          {
            path:
              "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
            dest: "/etc/nginx/vhost.d",
            name: "nginxproxydnpdappnodeeth_vhost.d",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          },
          {
            path: "/var/run/docker.sock",
            dest: "/tmp/docker.sock"
          },
          {
            path: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
            dest: "/usr/share/nginx/html",
            name: "nginxproxydnpdappnodeeth_html",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "951426e3fa2cbfd49a5198840764383af3961c2b29ba33a6b5f3dd45b953db9f",
        packageName: "DAppNodePackage-vipnode.dnp.dappnode.eth",
        version: "0.0.2",
        isDnp: true,
        isCore: false,
        created: 1560369616,
        image: "vipnode.dnp.dappnode.eth:0.0.2",
        name: "vipnode.dnp.dappnode.eth",
        shortName: "vipnode",
        ports: [],
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
            dest: "/app/.ethchain",
            name: "dncore_ethchaindnpdappnodeeth_data",
            users: ["vipnode.dnp.dappnode.eth", "ethchain.dnp.dappnode.eth"],
            owner: "ethchain.dnp.dappnode.eth",
            isOwner: false
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "539c5a2a32342365867689478b540d8d75c23d2dc1700bbed3b6171d754bb890",
        packageName: "DAppNodeCore-wifi.dnp.dappnode.eth",
        version: "0.2.0",
        isDnp: false,
        isCore: true,
        created: 1560354278,
        image: "wifi.dnp.dappnode.eth:0.2.0",
        name: "wifi.dnp.dappnode.eth",
        shortName: "wifi",
        ports: [],
        volumes: [
          {
            path: "/var/run/docker.sock",
            dest: "/var/run/docker.sock"
          }
        ],
        state: "exited",
        running: false,
        dependencies: {}
      },
      {
        id: "02b71c411d1d2e503afad679ab1c16a3e5cf086d5a298476fb30548b62d716f0",
        packageName: "DAppNodeCore-admin.dnp.dappnode.eth",
        version: "0.2.3",
        isDnp: false,
        isCore: true,
        created: 1560335154,
        image: "admin.dnp.dappnode.eth:0.2.3",
        name: "admin.dnp.dappnode.eth",
        shortName: "admin",
        ports: [
          {
            host: 8090,
            container: 8090,
            protocol: "TCP"
          },
          {
            container: 80,
            protocol: "TCP"
          }
        ],
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_shared/_data",
            dest: "/usr/www/openvpn/cred",
            name: "dncore_vpndnpdappnodeeth_shared",
            users: ["admin.dnp.dappnode.eth", "vpn.dnp.dappnode.eth"],
            owner: "vpn.dnp.dappnode.eth",
            isOwner: false
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "514b892b5e537f77515ee3278915a5fd1bf80228e8df6ed64b35c1a0fbdfbec0",
        packageName: "DAppNodeCore-vpn.dnp.dappnode.eth",
        version: "0.2.0",
        isDnp: false,
        isCore: true,
        created: 1560334861,
        image: "vpn.dnp.dappnode.eth:0.2.0",
        name: "vpn.dnp.dappnode.eth",
        shortName: "vpn",
        ports: [
          {
            host: 1194,
            container: 1194,
            protocol: "UDP"
          }
        ],
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_config/_data",
            dest: "/etc/openvpn",
            name: "dncore_vpndnpdappnodeeth_config",
            users: ["vpn.dnp.dappnode.eth"],
            owner: "vpn.dnp.dappnode.eth",
            isOwner: true
          },
          {
            path: "/etc/hostname",
            dest: "/etc/vpnname"
          },
          {
            path: "/lib/modules",
            dest: "/lib/modules"
          },
          {
            path: "/usr/src/dappnode/config",
            dest: "/usr/src/app/config"
          },
          {
            path: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data",
            dest: "/usr/src/app/secrets",
            name: "dncore_vpndnpdappnodeeth_data",
            users: ["vpn.dnp.dappnode.eth"],
            owner: "vpn.dnp.dappnode.eth",
            isOwner: true
          },
          {
            path: "/var/run/docker.sock",
            dest: "/var/run/docker.sock"
          },
          {
            path:
              "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_shared/_data",
            dest: "/var/spool/openvpn",
            name: "dncore_vpndnpdappnodeeth_shared",
            users: ["admin.dnp.dappnode.eth", "vpn.dnp.dappnode.eth"],
            owner: "vpn.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "51eaaba5c184da5605bf5ce1af4026592cdb3be1d6ff209a5cf0e3cf09c3f6a4",
        packageName: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
        version: "0.2.3",
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "dappmanager.dnp.dappnode.eth:0.2.3",
        name: "dappmanager.dnp.dappnode.eth",
        shortName: "dappmanager",
        ports: [],
        volumes: [
          {
            path: "/usr/src/dappnode/DNCORE",
            dest: "/usr/src/app/DNCORE"
          },
          {
            path:
              "/var/lib/docker/volumes/dncore_dappmanagerdnpdappnodeeth_data/_data",
            dest: "/usr/src/app/dnp_repo",
            name: "dncore_dappmanagerdnpdappnodeeth_data",
            users: ["dappmanager.dnp.dappnode.eth"],
            owner: "dappmanager.dnp.dappnode.eth",
            isOwner: true
          },
          {
            path: "/var/run/docker.sock",
            dest: "/var/run/docker.sock"
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "3dd5e6cd5756b7349636515bb0f50f3c9e35d75909ab9dfcb9c76cb9e54ab9c7",
        packageName: "DAppNodeCore-bind.dnp.dappnode.eth",
        version: "0.2.0",
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "bind.dnp.dappnode.eth:0.2.0",
        name: "bind.dnp.dappnode.eth",
        shortName: "bind",
        ports: [
          {
            container: 53,
            protocol: "UDP"
          }
        ],
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/dncore_binddnpdappnodeeth_data/_data",
            dest: "/etc/bind",
            name: "dncore_binddnpdappnodeeth_data",
            users: ["bind.dnp.dappnode.eth"],
            owner: "bind.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "e1766fd7a9d8110398b66c7b0f68fe625ee856f49526b987a54537028448476b",
        packageName: "DAppNodeCore-ethchain.dnp.dappnode.eth",
        version: "0.2.1",
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "ethchain.dnp.dappnode.eth:0.2.1",
        name: "ethchain.dnp.dappnode.eth",
        shortName: "ethchain",
        ports: [
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
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
            dest: "/root/.local/share/io.parity.ethereum",
            name: "dncore_ethchaindnpdappnodeeth_data",
            users: ["vipnode.dnp.dappnode.eth", "ethchain.dnp.dappnode.eth"],
            owner: "ethchain.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "a4ae8b09bc9b2037ff76f99436ddf1890e1215c2a17533ab73445726b41b2bef",
        packageName: "DAppNodeCore-ipfs.dnp.dappnode.eth",
        version: "0.2.2",
        isDnp: false,
        isCore: true,
        created: 1560334697,
        image: "ipfs.dnp.dappnode.eth:0.2.2",
        name: "ipfs.dnp.dappnode.eth",
        shortName: "ipfs",
        ports: [
          {
            container: 5001,
            protocol: "TCP"
          },
          {
            container: 8080,
            protocol: "TCP"
          },
          {
            container: 8081,
            protocol: "TCP"
          },
          {
            host: 4001,
            container: 4001,
            protocol: "TCP"
          },
          {
            host: 4002,
            container: 4002,
            protocol: "UDP"
          }
        ],
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_data/_data",
            dest: "/data/ipfs",
            name: "dncore_ipfsdnpdappnodeeth_data",
            users: ["ipfs.dnp.dappnode.eth"],
            owner: "ipfs.dnp.dappnode.eth",
            isOwner: true
          },
          {
            path:
              "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_export/_data",
            dest: "/export",
            name: "dncore_ipfsdnpdappnodeeth_export",
            users: ["ipfs.dnp.dappnode.eth"],
            owner: "ipfs.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "12cf3e376374f665d05a78bb20641cd9d5e36b7ab418b0ebec7c77b6798156c0",
        packageName: "DAppNodeCore-ethforward.dnp.dappnode.eth",
        version: "0.2.1",
        isDnp: false,
        isCore: true,
        created: 1560334412,
        image: "ethforward.dnp.dappnode.eth:0.2.1",
        name: "ethforward.dnp.dappnode.eth",
        shortName: "ethforward",
        ports: [],
        volumes: [],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "f789e9b7f00d7292c0db1f83b4dac063ce4a84d2bb3d55d12f9f492b7cbcbb2c",
        packageName: "DAppNodePackage-swarm.dnp.dappnode.eth",
        version: "0.1.0",
        isDnp: true,
        isCore: false,
        created: 1558708223,
        image: "swarm.dnp.dappnode.eth:0.1.0",
        name: "swarm.dnp.dappnode.eth",
        shortName: "swarm",
        ports: [
          {
            host: 30399,
            container: 30399,
            protocol: "TCP"
          },
          {
            host: 30399,
            container: 30399,
            protocol: "UDP"
          }
        ],
        volumes: [
          {
            path: "/var/lib/docker/volumes/swarmdnpdappnodeeth_swarm/_data",
            dest: "/root/.ethereum",
            name: "swarmdnpdappnodeeth_swarm",
            users: ["swarm.dnp.dappnode.eth"],
            owner: "swarm.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        dependencies: {}
      },
      {
        id: "b7f32fcefcd4bfb34d0c293378993e4a40eb3e62d8a928c4f183065834a10fb2",
        packageName: "DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth",
        version: "0.0.4",
        isDnp: true,
        isCore: false,
        created: 1558377639,
        image: "letsencrypt-nginx.dnp.dappnode.eth:0.0.4",
        name: "letsencrypt-nginx.dnp.dappnode.eth",
        shortName: "letsencrypt-nginx",
        ports: [],
        volumes: [
          {
            path: "/root/certs",
            dest: "/etc/nginx/certs"
          },
          {
            path:
              "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
            dest: "/etc/nginx/vhost.d",
            name: "nginxproxydnpdappnodeeth_vhost.d",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: false
          },
          {
            path: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
            dest: "/usr/share/nginx/html",
            name: "nginxproxydnpdappnodeeth_html",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: false
          },
          {
            path: "/var/run/docker.sock",
            dest: "/var/run/docker.sock"
          }
        ],
        state: "running",
        running: true,
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest"
        }
      },
      {
        id: "c944a1549ba675b7229b55370cfd2f54dca1f86050fbef7df4ba453398f93c24",
        packageName: "DAppNodePackage-ipfs-replicator.dnp.dappnode.eth",
        version: "0.1.0",
        isDnp: true,
        isCore: false,
        created: 1558258487,
        image: "ipfs-replicator.dnp.dappnode.eth:0.1.0",
        name: "ipfs-replicator.dnp.dappnode.eth",
        shortName: "ipfs-replicator",
        ports: [],
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/ipfsreplicatordnpdappnodeeth_pin-data/_data",
            dest: "/usr/src/app/data",
            name: "ipfsreplicatordnpdappnodeeth_pin-data",
            users: ["ipfs-replicator.dnp.dappnode.eth"],
            owner: "ipfs-replicator.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        origin: "/ipfs/QmYfVW2LNHH8ZXa6KJmfFAz5zCQ8YHh2ZPt6aQmezJcbL7",
        dependencies: {}
      },
      {
        id: "ffc3f4ed380ad42b7f847228862ad4de4ab471229bb5e1ed0aef46d4561309d2",
        packageName: "DAppNodePackage-goerli-geth.dnp.dappnode.eth",
        version: "0.2.2",
        isDnp: true,
        isCore: false,
        created: 1558258483,
        image: "goerli-geth.dnp.dappnode.eth:0.2.2",
        name: "goerli-geth.dnp.dappnode.eth",
        shortName: "goerli-geth",
        ports: [
          {
            host: 32769,
            container: 30303,
            protocol: "TCP"
          },
          {
            host: 32771,
            container: 30303,
            protocol: "UDP"
          },
          {
            host: 32770,
            container: 30304,
            protocol: "UDP"
          }
        ],
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/goerligethdnpdappnodeeth_goerli/_data",
            dest: "/goerli",
            name: "goerligethdnpdappnodeeth_goerli",
            users: ["goerli-geth.dnp.dappnode.eth"],
            owner: "goerli-geth.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        chain: "ethereum",
        dependencies: {}
      },
      {
        id: "94bde8655e2d8daca033486ef46e7d270c4f4b6f6c18b820d80c2cbf211130bd",
        packageName: "DAppNodePackage-ln.dnp.dappnode.eth",
        version: "0.1.1",
        isDnp: true,
        isCore: false,
        created: 1558258481,
        image: "ln.dnp.dappnode.eth:0.1.1",
        name: "ln.dnp.dappnode.eth",
        shortName: "ln",
        ports: [
          {
            container: 80,
            protocol: "TCP"
          },
          {
            host: 9735,
            container: 9735,
            protocol: "TCP"
          },
          {
            container: 10009,
            protocol: "TCP"
          }
        ],
        volumes: [
          {
            path:
              "/var/lib/docker/volumes/lndnpdappnodeeth_lndconfig_data/_data",
            dest: "/root/.lnd",
            name: "lndnpdappnodeeth_lndconfig_data",
            users: ["ln.dnp.dappnode.eth"],
            owner: "ln.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true,
        dependencies: {
          "bitcoin.dnp.dappnode.eth": "latest"
        }
      },
      {
        id: "d01badf202548868538e0435163e66a12f5bbb253e82150ed951e89a4c13690d",
        packageName: "DAppNodeCore-wamp.dnp.dappnode.eth",
        version: "0.2.0",
        isDnp: false,
        isCore: true,
        created: 1557330387,
        image: "wamp.dnp.dappnode.eth:0.2.0",
        name: "wamp.dnp.dappnode.eth",
        shortName: "wamp",
        ports: [
          {
            container: 8000,
            protocol: "TCP"
          },
          {
            container: 8080,
            protocol: "TCP"
          }
        ],
        volumes: [],
        state: "running",
        running: true,
        dependencies: {}
      }
    ];

    expect(dnpList).to.deep.equal(expectedDnpList);
  });
});
