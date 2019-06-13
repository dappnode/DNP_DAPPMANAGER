const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const dockerApiResponseContainers = require("./dockerApiSamples/containers.json");

describe("dockerList", function() {
  // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(name, params)

  async function dockerRequest() {
    return dockerApiResponseContainers;
  }

  const dockerList = proxyquire("modules/dockerList", {
    "modules/dockerRequest": dockerRequest
  });

  it("should parse an entire dockerList", async () => {
    const dnpList = await dockerList.listContainers();

    expect(dnpList).to.deep.equal([
      {
        id: "5407d28e2cca82b4e83351b2f55d07469703223e2296934f5034a8922e99d76d",
        packageName: "DAppNodePackage-otpweb.dnp.dappnode.eth",
        version: "0.0.3",
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest",
          "letsencrypt-nginx.dnp.dappnode.eth": "latest"
        },
        portsToClose: [],
        isDnp: true,
        isCore: false,
        created: 1560420780,
        image: "otpweb.dnp.dappnode.eth:0.0.3",
        name: "otpweb.dnp.dappnode.eth",
        shortName: "otpweb",
        ports: [
          {
            PrivatePort: 80,
            Type: "tcp"
          }
        ],
        volumes: [],
        state: "running",
        running: true
      },
      {
        id: "8a382e9a3b8ac449388470d06b98486b4fc965980fc5b72fd1c1cc77ae070484",
        packageName: "DAppNodePackage-nginx-proxy.dnp.dappnode.eth",
        version: "0.0.3",
        dependencies: {},
        portsToClose: [],
        isDnp: true,
        isCore: false,
        created: 1560420777,
        image: "nginx-proxy.dnp.dappnode.eth:0.0.3",
        name: "nginx-proxy.dnp.dappnode.eth",
        shortName: "nginx-proxy",
        ports: [
          {
            IP: "0.0.0.0",
            PrivatePort: 443,
            PublicPort: 443,
            Type: "tcp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 80,
            PublicPort: 80,
            Type: "tcp"
          }
        ],
        volumes: [
          {
            type: "bind",
            path: "/root/certs",
            dest: "/etc/nginx/certs"
          },
          {
            type: "volume",
            name:
              "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
            path: "",
            dest: "/etc/nginx/dhparam",
            users: ["nginx-proxy.dnp.dappnode.eth"],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          },
          {
            type: "volume",
            name: "nginxproxydnpdappnodeeth_vhost.d",
            path:
              "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
            dest: "/etc/nginx/vhost.d",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          },
          {
            type: "bind",
            path: "/var/run/docker.sock",
            dest: "/tmp/docker.sock"
          },
          {
            type: "volume",
            name: "nginxproxydnpdappnodeeth_html",
            path: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
            dest: "/usr/share/nginx/html",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "951426e3fa2cbfd49a5198840764383af3961c2b29ba33a6b5f3dd45b953db9f",
        packageName: "DAppNodePackage-vipnode.dnp.dappnode.eth",
        version: "0.0.2",
        dependencies: {},
        portsToClose: [],
        isDnp: true,
        isCore: false,
        created: 1560369616,
        image: "vipnode.dnp.dappnode.eth:0.0.2",
        name: "vipnode.dnp.dappnode.eth",
        shortName: "vipnode",
        ports: [],
        volumes: [
          {
            type: "volume",
            name: "dncore_ethchaindnpdappnodeeth_data",
            path:
              "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
            dest: "/app/.ethchain",
            users: ["vipnode.dnp.dappnode.eth", "ethchain.dnp.dappnode.eth"],
            owner: "ethchain.dnp.dappnode.eth",
            isOwner: false
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "539c5a2a32342365867689478b540d8d75c23d2dc1700bbed3b6171d754bb890",
        packageName: "DAppNodeCore-wifi.dnp.dappnode.eth",
        version: "0.2.0",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1560354278,
        image: "wifi.dnp.dappnode.eth:0.2.0",
        name: "wifi.dnp.dappnode.eth",
        shortName: "wifi",
        ports: [],
        volumes: [
          {
            type: "bind",
            path: "/var/run/docker.sock",
            dest: "/var/run/docker.sock"
          }
        ],
        state: "exited",
        running: false
      },
      {
        id: "02b71c411d1d2e503afad679ab1c16a3e5cf086d5a298476fb30548b62d716f0",
        packageName: "DAppNodeCore-admin.dnp.dappnode.eth",
        version: "0.2.3",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1560335154,
        image: "admin.dnp.dappnode.eth:0.2.3",
        name: "admin.dnp.dappnode.eth",
        shortName: "admin",
        ports: [
          {
            IP: "0.0.0.0",
            PrivatePort: 8090,
            PublicPort: 8090,
            Type: "tcp"
          },
          {
            PrivatePort: 80,
            Type: "tcp"
          }
        ],
        volumes: [
          {
            type: "volume",
            name: "dncore_vpndnpdappnodeeth_shared",
            path:
              "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_shared/_data",
            dest: "/usr/www/openvpn/cred",
            users: ["admin.dnp.dappnode.eth", "vpn.dnp.dappnode.eth"],
            owner: "vpn.dnp.dappnode.eth",
            isOwner: false
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "514b892b5e537f77515ee3278915a5fd1bf80228e8df6ed64b35c1a0fbdfbec0",
        packageName: "DAppNodeCore-vpn.dnp.dappnode.eth",
        version: "0.2.0",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1560334861,
        image: "vpn.dnp.dappnode.eth:0.2.0",
        name: "vpn.dnp.dappnode.eth",
        shortName: "vpn",
        ports: [
          {
            IP: "0.0.0.0",
            PrivatePort: 1194,
            PublicPort: 1194,
            Type: "udp"
          }
        ],
        volumes: [
          {
            type: "volume",
            name: "dncore_vpndnpdappnodeeth_config",
            path:
              "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_config/_data",
            dest: "/etc/openvpn",
            users: ["vpn.dnp.dappnode.eth"],
            owner: "vpn.dnp.dappnode.eth",
            isOwner: true
          },
          {
            type: "bind",
            path: "/etc/hostname",
            dest: "/etc/vpnname"
          },
          {
            type: "bind",
            path: "/lib/modules",
            dest: "/lib/modules"
          },
          {
            type: "bind",
            path: "/usr/src/dappnode/config",
            dest: "/usr/src/app/config"
          },
          {
            type: "volume",
            name: "dncore_vpndnpdappnodeeth_data",
            path: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data",
            dest: "/usr/src/app/secrets",
            users: ["vpn.dnp.dappnode.eth"],
            owner: "vpn.dnp.dappnode.eth",
            isOwner: true
          },
          {
            type: "bind",
            path: "/var/run/docker.sock",
            dest: "/var/run/docker.sock"
          },
          {
            type: "volume",
            name: "dncore_vpndnpdappnodeeth_shared",
            path:
              "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_shared/_data",
            dest: "/var/spool/openvpn",
            users: ["admin.dnp.dappnode.eth", "vpn.dnp.dappnode.eth"],
            owner: "vpn.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "51eaaba5c184da5605bf5ce1af4026592cdb3be1d6ff209a5cf0e3cf09c3f6a4",
        packageName: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
        version: "0.2.3",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "dappmanager.dnp.dappnode.eth:0.2.3",
        name: "dappmanager.dnp.dappnode.eth",
        shortName: "dappmanager",
        ports: [],
        volumes: [
          {
            type: "bind",
            path: "/usr/src/dappnode/DNCORE",
            dest: "/usr/src/app/DNCORE"
          },
          {
            type: "volume",
            name: "dncore_dappmanagerdnpdappnodeeth_data",
            path:
              "/var/lib/docker/volumes/dncore_dappmanagerdnpdappnodeeth_data/_data",
            dest: "/usr/src/app/dnp_repo",
            users: ["dappmanager.dnp.dappnode.eth"],
            owner: "dappmanager.dnp.dappnode.eth",
            isOwner: true
          },
          {
            type: "bind",
            path: "/var/run/docker.sock",
            dest: "/var/run/docker.sock"
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "3dd5e6cd5756b7349636515bb0f50f3c9e35d75909ab9dfcb9c76cb9e54ab9c7",
        packageName: "DAppNodeCore-bind.dnp.dappnode.eth",
        version: "0.2.0",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "bind.dnp.dappnode.eth:0.2.0",
        name: "bind.dnp.dappnode.eth",
        shortName: "bind",
        ports: [
          {
            PrivatePort: 53,
            Type: "udp"
          }
        ],
        volumes: [
          {
            type: "volume",
            name: "dncore_binddnpdappnodeeth_data",
            path:
              "/var/lib/docker/volumes/dncore_binddnpdappnodeeth_data/_data",
            dest: "/etc/bind",
            users: ["bind.dnp.dappnode.eth"],
            owner: "bind.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "e1766fd7a9d8110398b66c7b0f68fe625ee856f49526b987a54537028448476b",
        packageName: "DAppNodeCore-ethchain.dnp.dappnode.eth",
        version: "0.2.1",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1560334707,
        image: "ethchain.dnp.dappnode.eth:0.2.1",
        name: "ethchain.dnp.dappnode.eth",
        shortName: "ethchain",
        ports: [
          {
            IP: "0.0.0.0",
            PrivatePort: 30303,
            PublicPort: 30303,
            Type: "tcp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 30303,
            PublicPort: 30303,
            Type: "udp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 30304,
            PublicPort: 30304,
            Type: "udp"
          }
        ],
        volumes: [
          {
            type: "volume",
            name: "dncore_ethchaindnpdappnodeeth_data",
            path:
              "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
            dest: "/root/.local/share/io.parity.ethereum",
            users: ["vipnode.dnp.dappnode.eth", "ethchain.dnp.dappnode.eth"],
            owner: "ethchain.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "a4ae8b09bc9b2037ff76f99436ddf1890e1215c2a17533ab73445726b41b2bef",
        packageName: "DAppNodeCore-ipfs.dnp.dappnode.eth",
        version: "0.2.2",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1560334697,
        image: "ipfs.dnp.dappnode.eth:0.2.2",
        name: "ipfs.dnp.dappnode.eth",
        shortName: "ipfs",
        ports: [
          {
            PrivatePort: 5001,
            Type: "tcp"
          },
          {
            PrivatePort: 8080,
            Type: "tcp"
          },
          {
            PrivatePort: 8081,
            Type: "tcp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 4001,
            PublicPort: 4001,
            Type: "tcp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 4002,
            PublicPort: 4002,
            Type: "udp"
          }
        ],
        volumes: [
          {
            type: "volume",
            name: "dncore_ipfsdnpdappnodeeth_data",
            path:
              "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_data/_data",
            dest: "/data/ipfs",
            users: ["ipfs.dnp.dappnode.eth"],
            owner: "ipfs.dnp.dappnode.eth",
            isOwner: true
          },
          {
            type: "volume",
            name: "dncore_ipfsdnpdappnodeeth_export",
            path:
              "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_export/_data",
            dest: "/export",
            users: ["ipfs.dnp.dappnode.eth"],
            owner: "ipfs.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "12cf3e376374f665d05a78bb20641cd9d5e36b7ab418b0ebec7c77b6798156c0",
        packageName: "DAppNodeCore-ethforward.dnp.dappnode.eth",
        version: "0.2.1",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1560334412,
        image: "ethforward.dnp.dappnode.eth:0.2.1",
        name: "ethforward.dnp.dappnode.eth",
        shortName: "ethforward",
        ports: [],
        volumes: [],
        state: "running",
        running: true
      },
      {
        id: "f789e9b7f00d7292c0db1f83b4dac063ce4a84d2bb3d55d12f9f492b7cbcbb2c",
        packageName: "DAppNodePackage-swarm.dnp.dappnode.eth",
        version: "0.1.0",
        dependencies: {},
        portsToClose: [],
        isDnp: true,
        isCore: false,
        created: 1558708223,
        image: "swarm.dnp.dappnode.eth:0.1.0",
        name: "swarm.dnp.dappnode.eth",
        shortName: "swarm",
        ports: [
          {
            IP: "0.0.0.0",
            PrivatePort: 30399,
            PublicPort: 30399,
            Type: "tcp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 30399,
            PublicPort: 30399,
            Type: "udp"
          }
        ],
        volumes: [
          {
            type: "volume",
            name: "swarmdnpdappnodeeth_swarm",
            path: "/var/lib/docker/volumes/swarmdnpdappnodeeth_swarm/_data",
            dest: "/root/.ethereum",
            users: ["swarm.dnp.dappnode.eth"],
            owner: "swarm.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "b7f32fcefcd4bfb34d0c293378993e4a40eb3e62d8a928c4f183065834a10fb2",
        packageName: "DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth",
        version: "0.0.4",
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest"
        },
        portsToClose: [],
        isDnp: true,
        isCore: false,
        created: 1558377639,
        image: "letsencrypt-nginx.dnp.dappnode.eth:0.0.4",
        name: "letsencrypt-nginx.dnp.dappnode.eth",
        shortName: "letsencrypt-nginx",
        ports: [],
        volumes: [
          {
            type: "bind",
            path: "/root/certs",
            dest: "/etc/nginx/certs"
          },
          {
            type: "volume",
            name: "nginxproxydnpdappnodeeth_vhost.d",
            path:
              "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
            dest: "/etc/nginx/vhost.d",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: false
          },
          {
            type: "volume",
            name: "nginxproxydnpdappnodeeth_html",
            path: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
            dest: "/usr/share/nginx/html",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: false
          },
          {
            type: "bind",
            path: "/var/run/docker.sock",
            dest: "/var/run/docker.sock"
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "c944a1549ba675b7229b55370cfd2f54dca1f86050fbef7df4ba453398f93c24",
        packageName: "DAppNodePackage-ipfs-replicator.dnp.dappnode.eth",
        version: "0.1.0",
        origin: "/ipfs/QmYfVW2LNHH8ZXa6KJmfFAz5zCQ8YHh2ZPt6aQmezJcbL7",
        portsToClose: [],
        isDnp: true,
        isCore: false,
        created: 1558258487,
        image: "ipfs-replicator.dnp.dappnode.eth:0.1.0",
        name: "ipfs-replicator.dnp.dappnode.eth",
        shortName: "ipfs-replicator",
        ports: [],
        volumes: [
          {
            type: "volume",
            name: "ipfsreplicatordnpdappnodeeth_pin-data",
            path:
              "/var/lib/docker/volumes/ipfsreplicatordnpdappnodeeth_pin-data/_data",
            dest: "/usr/src/app/data",
            users: ["ipfs-replicator.dnp.dappnode.eth"],
            owner: "ipfs-replicator.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "ffc3f4ed380ad42b7f847228862ad4de4ab471229bb5e1ed0aef46d4561309d2",
        packageName: "DAppNodePackage-goerli-geth.dnp.dappnode.eth",
        version: "0.2.2",
        chain: "ethereum",
        portsToClose: [
          {
            number: 32769,
            type: "TCP"
          },
          {
            number: 32771,
            type: "UDP"
          },
          {
            number: 32770,
            type: "UDP"
          }
        ],
        isDnp: true,
        isCore: false,
        created: 1558258483,
        image: "goerli-geth.dnp.dappnode.eth:0.2.2",
        name: "goerli-geth.dnp.dappnode.eth",
        shortName: "goerli-geth",
        ports: [
          {
            IP: "0.0.0.0",
            PrivatePort: 30303,
            PublicPort: 32769,
            Type: "tcp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 30303,
            PublicPort: 32771,
            Type: "udp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 30304,
            PublicPort: 32770,
            Type: "udp"
          }
        ],
        volumes: [
          {
            type: "volume",
            name: "goerligethdnpdappnodeeth_goerli",
            path:
              "/var/lib/docker/volumes/goerligethdnpdappnodeeth_goerli/_data",
            dest: "/goerli",
            users: ["goerli-geth.dnp.dappnode.eth"],
            owner: "goerli-geth.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "94bde8655e2d8daca033486ef46e7d270c4f4b6f6c18b820d80c2cbf211130bd",
        packageName: "DAppNodePackage-ln.dnp.dappnode.eth",
        version: "0.1.1",
        dependencies: {
          "bitcoin.dnp.dappnode.eth": "latest"
        },
        portsToClose: [],
        isDnp: true,
        isCore: false,
        created: 1558258481,
        image: "ln.dnp.dappnode.eth:0.1.1",
        name: "ln.dnp.dappnode.eth",
        shortName: "ln",
        ports: [
          {
            PrivatePort: 80,
            Type: "tcp"
          },
          {
            IP: "0.0.0.0",
            PrivatePort: 9735,
            PublicPort: 9735,
            Type: "tcp"
          },
          {
            PrivatePort: 10009,
            Type: "tcp"
          }
        ],
        volumes: [
          {
            type: "volume",
            name: "lndnpdappnodeeth_lndconfig_data",
            path:
              "/var/lib/docker/volumes/lndnpdappnodeeth_lndconfig_data/_data",
            dest: "/root/.lnd",
            users: ["ln.dnp.dappnode.eth"],
            owner: "ln.dnp.dappnode.eth",
            isOwner: true
          }
        ],
        state: "running",
        running: true
      },
      {
        id: "d01badf202548868538e0435163e66a12f5bbb253e82150ed951e89a4c13690d",
        packageName: "DAppNodeCore-wamp.dnp.dappnode.eth",
        version: "0.2.0",
        portsToClose: [],
        isDnp: false,
        isCore: true,
        created: 1557330387,
        image: "wamp.dnp.dappnode.eth:0.2.0",
        name: "wamp.dnp.dappnode.eth",
        shortName: "wamp",
        ports: [
          {
            PrivatePort: 8000,
            Type: "tcp"
          },
          {
            PrivatePort: 8080,
            Type: "tcp"
          }
        ],
        volumes: [],
        state: "running",
        running: true
      }
    ]);
  });
});
