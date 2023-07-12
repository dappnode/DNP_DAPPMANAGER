import Docker from "dockerode";

// Eslint does not ignore the directive to ignore camel case errors
// 33:9  error  Identifier 'dncore_network' is not in camel case  @typescript-eslint/camelcase
// Adding
// // eslint-disable
// Does not stop the error from happening
const dncoreNetwork = "dncore_network";

export const dockerApiResponseContainers: Docker.ContainerInfo[] = [
  {
    Command: "nginx -g 'daemon off;'",
    Created: 1560420780,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "5407d28e2cca82b4e83351b2f55d07469703223e2296934f5034a8922e99d76d",
    Image: "otpweb.dnp.dappnode.eth:0.0.3",
    ImageID:
      "sha256:5d1ec8daf089f9f84619441d736a2d0759352b59db1753d5397757d9578c432b",
    Labels: {
      "com.docker.compose.config-hash":
        "0d6bf9740d1622779193d37edf33e28ddb79bfc46ac6ea6c75132cea31df2e65",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "otpwebdnpdappnodeeth",
      "com.docker.compose.service": "otpweb.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      "dappnode.dnp.dependencies":
        '{"nginx-proxy.dnp.dappnode.eth":"latest","letsencrypt-nginx.dnp.dappnode.eth":"latest"}',
      maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>",
      "dappnode.dnp.default.ports": "[]"
    },
    Mounts: [],
    Names: ["/DAppNodePackage-otpweb.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "2531ac0ff8694fe54f6fb3587811bcfebcaecc382dead7e85e8ffd6cfd2c4705",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: null,
          IPAddress: "172.33.0.9",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:00:09",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
      {
        PrivatePort: 80,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      }
    ],
    State: "running",
    Status: "Up 5 hours"
  },
  {
    Command: "/app/docker-entrypoint.sh forego start -r",
    Created: 1560420777,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "8a382e9a3b8ac449388470d06b98486b4fc965980fc5b72fd1c1cc77ae070484",
    Image: "nginx-proxy.dnp.dappnode.eth:0.0.3",
    ImageID:
      "sha256:c242241205d1c6eda03ce9d1bd01a3c3ef57313dd08245f704f698a850c0f44f",
    Labels: {
      "com.docker.compose.config-hash":
        "10e1a8c31de331f37740c753a39cbc86883447afded4c1e68a535dbba86aa227",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "nginxproxydnpdappnodeeth",
      "com.docker.compose.service": "nginx-proxy.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      "com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy": "",
      "dappnode.dnp.dependencies": "{}",
      maintainer: "Jason Wilder mail@jasonwilder.com"
    },
    Mounts: [
      {
        Destination: "/etc/nginx/certs",
        Mode: "ro",
        Propagation: "rprivate",
        RW: false,
        Source: "/root/certs",
        Type: "bind"
      },
      {
        Destination: "/etc/nginx/dhparam",
        Driver: "local",
        Mode: "",
        Name: "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
        Propagation: "",
        RW: true,
        Source: "",
        Type: "volume"
      },
      {
        Destination: "/etc/nginx/vhost.d",
        Driver: "local",
        Mode: "rw",
        Name: "nginxproxydnpdappnodeeth_vhost.d",
        Propagation: "",
        RW: true,
        Source:
          "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
        Type: "volume"
      },
      {
        Destination: "/tmp/docker.sock",
        Mode: "ro",
        Propagation: "rprivate",
        RW: false,
        Source: "/var/run/docker.sock",
        Type: "bind"
      },
      {
        Destination: "/usr/share/nginx/html",
        Driver: "local",
        Mode: "rw",
        Name: "nginxproxydnpdappnodeeth_html",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodePackage-nginx-proxy.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "ec0a59a1019c2f72943b5d9032484a0ba67385e054cb36772f20a32b7d70efa4",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: null,
          IPAddress: "172.33.0.6",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:00:06",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
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
    State: "running",
    Status: "Up 5 hours"
  },
  {
    Command:
      "/bin/sh -c 'vipnode host --rpc=http://my.ethchain.dnp.dappnode.eth:8545 -vv --payout=${PAYOUT_ADDRESS} --nodekey=/app/.ethchain/network/key'",
    Created: 1560369616,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "951426e3fa2cbfd49a5198840764383af3961c2b29ba33a6b5f3dd45b953db9f",
    Image: "vipnode.dnp.dappnode.eth:0.0.2",
    ImageID:
      "sha256:12c0721978f35ab4ca9dc3d13dee086c7c36dee954cb95fdfb49a58d52c2f8f5",
    Labels: {
      "com.docker.compose.config-hash":
        "117f4d9eff400b81a4b6ec81ff21d046833001116cce050d0600891da3a24888",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "vipnodednpdappnodeeth",
      "com.docker.compose.service": "vipnode.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      "dappnode.dnp.dependencies": "{}"
    },
    Mounts: [
      {
        Destination: "/app/.ethchain",
        Driver: "local",
        Mode: "ro",
        Name: "dncore_ethchaindnpdappnodeeth_data",
        Propagation: "",
        RW: false,
        Source:
          "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodePackage-vipnode.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "c1b6f11f0ea3d45bd9d80c058e8018796809d000822b819a4eff465fcedc8dc0",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: null,
          IPAddress: "172.33.0.5",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:00:05",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [],
    State: "running",
    Status: "Up 9 hours"
  },
  {
    Command: "/bin/wlanstart.sh",
    Created: 1560354278,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "539c5a2a32342365867689478b540d8d75c23d2dc1700bbed3b6171d754bb890",
    Image: "wifi.dnp.dappnode.eth:0.2.0",
    ImageID:
      "sha256:6ff4fc3d3200d3e56973b5eec60b0adfcd2ba890767e66d0295b7fd0c4e2d6f1",
    Labels: {
      "com.docker.compose.config-hash":
        "56b102ddac3685802f0e1943c555b29d73ed7e6e6d7abd66e11232fe900023c9",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "wifi.dnp.dappnode.eth",
      "com.docker.compose.version": "1.22.0"
    },
    Mounts: [
      {
        Destination: "/var/run/docker.sock",
        Mode: "rw",
        Propagation: "rprivate",
        RW: true,
        Source: "/var/run/docker.sock",
        Type: "bind"
      }
    ],
    Names: ["/DAppNodeCore-wifi.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID: "",
          Gateway: "",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.10"
          },
          IPAddress: "",
          IPPrefixLen: 0,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [],
    State: "exited",
    Status: "Exited (137) 19 hours ago"
  },
  {
    Command: "nginx -c /etc/nginx/nginx.conf -g 'daemon off;'",
    Created: 1560335154,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "02b71c411d1d2e503afad679ab1c16a3e5cf086d5a298476fb30548b62d716f0",
    Image: "admin.dnp.dappnode.eth:0.2.3",
    ImageID:
      "sha256:d524055bf341ca0729920893feb7ff68c4f0308ddce2af7fa9e78b707f7a26c7",
    Labels: {
      "com.docker.compose.config-hash":
        "c6c60533a7e09f813907dcdb20d026194bb81303798799c31308a63d7ce2b826",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "admin.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>"
    },
    Mounts: [
      {
        Destination: "/usr/www/openvpn/cred",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_vpndnpdappnodeeth_shared",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_shared/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodeCore-admin.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "076493fb103dc5295f587bcab6df39e83ee6b71409ad735f9c18801a3e46254b",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.9"
          },
          IPAddress: "172.33.1.9",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:01:09",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
      {
        IP: "0.0.0.0",
        PrivatePort: 8090,
        PublicPort: 8090,
        Type: "tcp"
      },
      {
        PrivatePort: 80,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      }
    ],
    State: "running",
    Status: "Up 29 hours"
  },
  {
    Command: "./entrypoint.sh",
    Created: 1560334861,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "514b892b5e537f77515ee3278915a5fd1bf80228e8df6ed64b35c1a0fbdfbec0",
    Image: "vpn.dnp.dappnode.eth:0.2.0",
    ImageID:
      "sha256:02a7d21fa690d87a5facaf40f3ebee9e6c3ca8dee8b432af26a1a11753350dbd",
    Labels: {
      "com.docker.compose.config-hash":
        "178eee2b5d804afa79b3502a7158445b704399c735a7d3f305622dd7c9b95b1c",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "vpn.dnp.dappnode.eth",
      "com.docker.compose.version": "1.22.0"
    },
    Mounts: [
      {
        Destination: "/etc/openvpn",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_vpndnpdappnodeeth_config",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_config/_data",
        Type: "volume"
      },
      {
        Destination: "/etc/vpnname",
        Mode: "ro",
        Propagation: "rprivate",
        RW: false,
        Source: "/etc/hostname",
        Type: "bind"
      },
      {
        Destination: "/lib/modules",
        Mode: "ro",
        Propagation: "rprivate",
        RW: false,
        Source: "/lib/modules",
        Type: "bind"
      },
      {
        Destination: "/usr/src/app/config",
        Mode: "ro",
        Propagation: "rprivate",
        RW: false,
        Source: "/usr/src/dappnode/config",
        Type: "bind"
      },
      {
        Destination: "/usr/src/app/secrets",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_vpndnpdappnodeeth_data",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data",
        Type: "volume"
      },
      {
        Destination: "/var/run/docker.sock",
        Mode: "rw",
        Propagation: "rprivate",
        RW: true,
        Source: "/var/run/docker.sock",
        Type: "bind"
      },
      {
        Destination: "/var/spool/openvpn",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_vpndnpdappnodeeth_shared",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_shared/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodeCore-vpn.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "bd086d83ba265fce4d93349448b8cedfe5bb7565ccd89cf2fad3d3dba7d441d9",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.4"
          },
          IPAddress: "172.33.1.4",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:01:04",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
      {
        IP: "0.0.0.0",
        PrivatePort: 1194,
        PublicPort: 1194,
        Type: "udp"
      }
    ],
    State: "running",
    Status: "Up 29 hours"
  },
  {
    Command: "/bin/sh -c /usr/src/app/entrypoint.sh",
    Created: 1560334707,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "51eaaba5c184da5605bf5ce1af4026592cdb3be1d6ff209a5cf0e3cf09c3f6a4",
    Image: "dappmanager.dnp.dappnode.eth:0.2.3",
    ImageID:
      "sha256:2ff401547f016466c6d99ec54647025cd842e1a31e5bff53742ba14eaabbdfbb",
    Labels: {
      "com.docker.compose.config-hash":
        "263de2c2d31b95658c69686680b78c9af71c0957f2e56c04acad3958cc4e6f16",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "dappmanager.dnp.dappnode.eth",
      "com.docker.compose.version": "1.22.0"
    },
    Mounts: [
      {
        Destination: "/usr/src/app/DNCORE",
        Mode: "rw",
        Propagation: "rprivate",
        RW: true,
        Source: "/usr/src/dappnode/DNCORE",
        Type: "bind"
      },
      {
        Destination: "/usr/src/app/dnp_repo",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_dappmanagerdnpdappnodeeth_data",
        Propagation: "",
        RW: true,
        Source:
          "/var/lib/docker/volumes/dncore_dappmanagerdnpdappnodeeth_data/_data",
        Type: "volume"
      },
      {
        Destination: "/var/run/docker.sock",
        Mode: "rw",
        Propagation: "rprivate",
        RW: true,
        Source: "/var/run/docker.sock",
        Type: "bind"
      }
    ],
    Names: ["/DAppNodeCore-dappmanager.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "98db1673a9e729ba76c4349c13fbaa4e7113d0fe0ba9d1c46035c125e051bc0a",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.7"
          },
          IPAddress: "172.33.1.7",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:01:07",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [],
    State: "running",
    Status: "Up 29 hours"
  },
  {
    Command: "entrypoint.sh",
    Created: 1560334707,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "3dd5e6cd5756b7349636515bb0f50f3c9e35d75909ab9dfcb9c76cb9e54ab9c7",
    Image: "bind.dnp.dappnode.eth:0.2.0",
    ImageID:
      "sha256:af8539f3b3f2f5637afab068da01a3fdbe631ff812631ebeb70c713448b8dde0",
    Labels: {
      "com.docker.compose.config-hash":
        "1b53894c004445d1f33cbd15bd4ff44f589d5e0c4d58bebda4d76beb6ede6cf9",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "bind.dnp.dappnode.eth",
      "com.docker.compose.version": "1.22.0"
    },
    Mounts: [
      {
        Destination: "/etc/bind",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_binddnpdappnodeeth_data",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/dncore_binddnpdappnodeeth_data/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodeCore-bind.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "c0b656885a60356361e325a2e53c3043a2e485293c8e0346a37932b24c998ae6",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.2"
          },
          IPAddress: "172.33.1.2",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:01:02",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
      {
        PrivatePort: 53,
        Type: "udp",
        PublicPort: 0,
        IP: "0.0.0.0"
      }
    ],
    State: "running",
    Status: "Up 29 hours"
  },
  {
    Command:
      "/bin/sh -c 'parity --jsonrpc-port 8545 --jsonrpc-interface all --jsonrpc-hosts all --jsonrpc-cors all --ws-interface 0.0.0.0 --ws-port 8546 --ws-origins all --ws-hosts all --ws-max-connections 1000 --warp-barrier 7400000 $EXTRA_OPTS'",
    Created: 1560334707,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "e1766fd7a9d8110398b66c7b0f68fe625ee856f49526b987a54537028448476b",
    Image: "ethchain.dnp.dappnode.eth:0.2.1",
    ImageID:
      "sha256:646da4b970b2fb100012bced7abe4e8c442987edb2072f8e4f3bd298dded9950",
    Labels: {
      "com.docker.compose.config-hash":
        "31118f2e2d1579af7b8cc3d858317631f4d5f804ba1d8e1cee7036947589d6c9",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "ethchain.dnp.dappnode.eth",
      "com.docker.compose.version": "1.22.0",
      "dappnode.dnp.default.environment":
        '["EXTRA_OPTS=--warp-barrier 8540000","EXTRA_OPTS_GETH=","DEFAULT_CLIENT=PARITY"]',
      "dappnode.dnp.default.ports":
        '["30303:30303","30303:30303/udp","30304:30304/udp"]',
      "dappnode.dnp.default.volumes":
        '["ethchaindnpdappnodeeth_data:/root/.local/share/io.parity.ethereum","ethchaindnpdappnodeeth_geth:/root/.ethereum/","ethchaindnpdappnodeeth_identity:/root/identity/"]',
      "dappnode.dnp.dependencies": "{}",
      "dappnode.dnp.avatar":
        "/ipfs/QmQnHxr4YAVdtqzHnsDYvmXizxptSYyaj3YwTjoiLshVwF",
      "dappnode.dnp.chain": "ethereum",
      "dappnode.dnp.origin":
        "/ipfs/QmeBfnwgsNcEmbmxENBWtgkv5YZsAhiaDsoYd7nMTV1wKV",
      "dappnode.dnp.isCore": "true"
    },
    Mounts: [
      {
        Destination: "/root/.local/share/io.parity.ethereum",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_ethchaindnpdappnodeeth_data",
        Propagation: "",
        RW: true,
        Source:
          "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodeCore-ethchain.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "9e123105252472ccbf966d30829f33715efb58d4afcce2daa54ae6ca3b18a617",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.6"
          },
          IPAddress: "172.33.1.6",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:01:06",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
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
    State: "running",
    Status: "Up 29 hours"
  },
  {
    Command: "/sbin/tini -- /usr/local/bin/start_ipfs daemon --migrate=true",
    Created: 1560334697,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "a4ae8b09bc9b2037ff76f99436ddf1890e1215c2a17533ab73445726b41b2bef",
    Image: "ipfs.dnp.dappnode.eth:0.2.2",
    ImageID:
      "sha256:163a33c60906e36833306c0c5fb4e742a84173c254cdf571d450370bbfd50751",
    Labels: {
      "com.docker.compose.config-hash":
        "53e42eef9f08ede81dc7d3a05e64b9c64400250fc881962b0f9ebd0b485363a5",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "ipfs.dnp.dappnode.eth",
      "com.docker.compose.version": "1.22.0",
      "dappnode.dnp.default.ports": '["4001:4001","4002:4002/udp"]'
    },
    Mounts: [
      {
        Destination: "/data/ipfs",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_ipfsdnpdappnodeeth_data",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_data/_data",
        Type: "volume"
      },
      {
        Destination: "/export",
        Driver: "local",
        Mode: "rw",
        Name: "dncore_ipfsdnpdappnodeeth_export",
        Propagation: "",
        RW: true,
        Source:
          "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_export/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodeCore-ipfs.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "db3741f01bc559ab2613aac8a14625bb79745613a8ef30a79bcd732fcecc4dfd",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.5"
          },
          IPAddress: "172.33.1.5",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:01:05",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
      {
        PrivatePort: 5001,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      },
      {
        PrivatePort: 8080,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      },
      {
        PrivatePort: 8081,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
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
    State: "running",
    Status: "Up 29 hours"
  },
  {
    Command: "/bin/sh -c 'node /usr/src/app/bundle.js'",
    Created: 1560334412,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "12cf3e376374f665d05a78bb20641cd9d5e36b7ab418b0ebec7c77b6798156c0",
    Image: "ethforward.dnp.dappnode.eth:0.2.1",
    ImageID:
      "sha256:8e3f5f9ed14abb6c5fe008fa595136cdaaf1c94e7544b5c4f3750275d2c90b28",
    Labels: {
      "com.docker.compose.config-hash":
        "4510ed11939156c0bf4e0784a3c661a866beb9dab0c699a0d65dbd7b5e9ce175",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "ethforward.dnp.dappnode.eth",
      "com.docker.compose.version": "1.22.0"
    },
    Mounts: [],
    Names: ["/DAppNodeCore-ethforward.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "f880d10e3f26d3266f604eeb1d1435886a872e6438262adf8abc632d8c1e5ff1",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.3"
          },
          IPAddress: "172.33.1.3",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:01:03",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [],
    State: "running",
    Status: "Up 29 hours"
  },
  {
    Command: "run.sh",
    Created: 1558708223,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "f789e9b7f00d7292c0db1f83b4dac063ce4a84d2bb3d55d12f9f492b7cbcbb2c",
    Image: "swarm.dnp.dappnode.eth:0.1.0",
    ImageID:
      "sha256:82cf739f2893f5f02c6c5295d28250dead81f2025734e1a2c963df126ea2ec54",
    Labels: {
      "com.docker.compose.config-hash":
        "5e698cef3803472edc1fcc3bba0fe16c24f3b65a8b97b57551f555a2a732b99f",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "swarmdnpdappnodeeth",
      "com.docker.compose.service": "swarm.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      "dappnode.dnp.dependencies": "{}"
    },
    Mounts: [
      {
        Destination: "/root/.ethereum",
        Driver: "local",
        Mode: "rw",
        Name: "swarmdnpdappnodeeth_swarm",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/swarmdnpdappnodeeth_swarm/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodePackage-swarm.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "125ccd94b2a75f0cd40862a09b71e1aac702f59f2cfa42fa00263d159103f8d8",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: null,
          IPAddress: "172.33.0.7",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:00:07",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
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
    State: "running",
    Status: "Up 2 weeks"
  },
  {
    Command: "/bin/bash /app/entrypoint.sh /bin/bash /app/start.sh",
    Created: 1558377639,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "b7f32fcefcd4bfb34d0c293378993e4a40eb3e62d8a928c4f183065834a10fb2",
    Image: "letsencrypt-nginx.dnp.dappnode.eth:0.0.4",
    ImageID:
      "sha256:1658e6d884c600b347f91f62a64331d3cb7dce89148b4a69d86fac3ad36626f4",
    Labels: {
      "com.docker.compose.config-hash":
        "ca8fea4d0f0081049a83a348ccf203dc04fd7301b79634e5eb1282b88a16753e",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "letsencryptnginxdnpdappnodeeth",
      "com.docker.compose.service": "letsencrypt-nginx.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      "dappnode.dnp.dependencies": '{"nginx-proxy.dnp.dappnode.eth":"latest"}',
      maintainer: "Yves Blusseau <90z7oey02@sneakemail.com> (@blusseau)"
    },
    Mounts: [
      {
        Destination: "/etc/nginx/certs",
        Mode: "rw",
        Propagation: "rprivate",
        RW: true,
        Source: "/root/certs",
        Type: "bind"
      },
      {
        Destination: "/etc/nginx/vhost.d",
        Driver: "local",
        Mode: "rw",
        Name: "nginxproxydnpdappnodeeth_vhost.d",
        Propagation: "",
        RW: true,
        Source:
          "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
        Type: "volume"
      },
      {
        Destination: "/usr/share/nginx/html",
        Driver: "local",
        Mode: "rw",
        Name: "nginxproxydnpdappnodeeth_html",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
        Type: "volume"
      },
      {
        Destination: "/var/run/docker.sock",
        Mode: "ro",
        Propagation: "rprivate",
        RW: false,
        Source: "/var/run/docker.sock",
        Type: "bind"
      }
    ],
    Names: ["/DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "c0f21fc23fa535a659b3feb92464c366e287cc50f6208f8a6670674c78b4c00f",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: null,
          IPAddress: "172.33.0.8",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:00:08",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [],
    State: "running",
    Status: "Up 3 weeks"
  },
  {
    Command: "/bin/sh -c 'node /usr/src/app/bundle.js'",
    Created: 1558258487,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "c944a1549ba675b7229b55370cfd2f54dca1f86050fbef7df4ba453398f93c24",
    Image: "ipfs-replicator.dnp.dappnode.eth:0.1.0",
    ImageID:
      "sha256:09835191918920701cea65129dd5e0f2d758341fd1a0fe3d6cb40ec7de1954fb",
    Labels: {
      "com.docker.compose.config-hash":
        "da6f3c5917724f786a965648350452b52b3aba9274616705d86c350978b183cd",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "ipfsreplicatordnpdappnodeeth",
      "com.docker.compose.service": "ipfs-replicator.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      "dappnode.dnp.origin":
        "/ipfs/QmYfVW2LNHH8ZXa6KJmfFAz5zCQ8YHh2ZPt6aQmezJcbL7"
    },
    Mounts: [
      {
        Destination: "/usr/src/app/data",
        Driver: "local",
        Mode: "rw",
        Name: "ipfsreplicatordnpdappnodeeth_pin-data",
        Propagation: "",
        RW: true,
        Source:
          "/var/lib/docker/volumes/ipfsreplicatordnpdappnodeeth_pin-data/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodePackage-ipfs-replicator.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "88ccad37b5c38e3504017442ed9b04c4fcb25ca1f72292ddf24e089af510e08b",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: null,
          IPAddress: "172.33.0.4",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:00:04",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [],
    State: "running",
    Status: "Up 3 weeks"
  },
  {
    Command:
      '/bin/sh -c \'geth --datadir /goerli --goerli --rpc --rpcaddr 0.0.0.0 --rpccorsdomain "*" --rpcvhosts "*" --ws --wsorigins "*" --wsaddr 0.0.0.0 $EXTRA_OPTS\'',
    Created: 1558258483,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "ffc3f4ed380ad42b7f847228862ad4de4ab471229bb5e1ed0aef46d4561309d2",
    Image: "goerli-geth.dnp.dappnode.eth:0.2.2",
    ImageID:
      "sha256:5dc0c9530448276bd102accaad853a252dd8089f2900c9f2c756fae0b6f6d8ec",
    Labels: {
      "com.docker.compose.config-hash":
        "acaf0f292fa641ac114e9a62dd9581b167379a433cad7f0f796ae1e8c427aab2",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "goerligethdnpdappnodeeth",
      "com.docker.compose.service": "goerli-geth.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      "dappnode.dnp.chain": "ethereum",
      portsToClose:
        '[{"number":32769,"type":"TCP"},{"number":32771,"type":"UDP"},{"number":32770,"type":"UDP"}]'
    },
    Mounts: [
      {
        Destination: "/goerli",
        Driver: "local",
        Mode: "rw",
        Name: "goerligethdnpdappnodeeth_goerli",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/goerligethdnpdappnodeeth_goerli/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodePackage-goerli-geth.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "5efa0a2388a402fd3ecd7ae5ab0d503c4f528767d0e00e59f255013d5405f1f4",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: null,
          IPAddress: "172.33.0.3",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:00:03",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
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
    State: "running",
    Status: "Up 3 weeks"
  },
  {
    Command: "supervisord -c /supervisord.conf",
    Created: 1558258481,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "94bde8655e2d8daca033486ef46e7d270c4f4b6f6c18b820d80c2cbf211130bd",
    Image: "ln.dnp.dappnode.eth:0.1.1",
    ImageID:
      "sha256:41214dd9be6c51b33b6872f174151c69f83409d33a9eaa7ee78032faa1b03c69",
    Labels: {
      "com.docker.compose.config-hash":
        "a458dcb93640f82123abf4e5beccb7dcb1773f6ef58af65b322581da551491b1",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "lndnpdappnodeeth",
      "com.docker.compose.service": "ln.dnp.dappnode.eth",
      "com.docker.compose.version": "1.20.1",
      "dappnode.dnp.dependencies": '{"bitcoin.dnp.dappnode.eth":"latest"}'
    },
    Mounts: [
      {
        Destination: "/root/.lnd",
        Driver: "local",
        Mode: "rw",
        Name: "lndnpdappnodeeth_lndconfig_data",
        Propagation: "",
        RW: true,
        Source: "/var/lib/docker/volumes/lndnpdappnodeeth_lndconfig_data/_data",
        Type: "volume"
      }
    ],
    Names: ["/DAppNodePackage-ln.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "f6bdd575b22ce0df36bdb408ea9c1f3ae291ab398f5aecc79f63ffd8e6f3fe41",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: null,
          IPAddress: "172.33.0.2",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:00:02",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
      {
        PrivatePort: 80,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      },
      {
        IP: "0.0.0.0",
        PrivatePort: 9735,
        PublicPort: 9735,
        Type: "tcp"
      },
      {
        PrivatePort: 10009,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      }
    ],
    State: "running",
    Status: "Up 3 weeks"
  },
  {
    Command: "crossbar start --cbdir /node/.crossbar",
    Created: 1557330387,
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    Id: "d01badf202548868538e0435163e66a12f5bbb253e82150ed951e89a4c13690d",
    Image: "wamp.dnp.dappnode.eth:0.2.0",
    ImageID:
      "sha256:d8e65977f9e219b3b305b7f554e19141819c4749cebf5ec3d44c23ee0a748ac1",
    Labels: {
      "com.docker.compose.config-hash":
        "7886a2bf0a84e2766732c8506bed5817890f583d8f26908dd5c1c01300fac623",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dncore",
      "com.docker.compose.service": "wamp.dnp.dappnode.eth",
      "com.docker.compose.version": "1.22.0",
      "org.label-schema.build-date": "",
      "org.label-schema.description":
        "Quickstart template for application development with Crossbar.io",
      "org.label-schema.name": "Crossbar.io Starter Template",
      "org.label-schema.schema-version": "1.0",
      "org.label-schema.url": "http://crossbar.io",
      "org.label-schema.vcs-ref": "",
      "org.label-schema.vcs-url": "https://github.com/crossbario/crossbar",
      "org.label-schema.vendor": "The Crossbar.io Project",
      "org.label-schema.version": ""
    },
    Mounts: [],
    Names: ["/DAppNodeCore-wamp.dnp.dappnode.eth"],
    NetworkSettings: {
      Networks: {
        [dncoreNetwork]: {
          Aliases: null,
          EndpointID:
            "24f23c27b47c38ecf9f4a64c18084312ec3ed4529b160346765d915692298ab5",
          Gateway: "172.33.0.1",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          IPAMConfig: {
            IPv4Address: "172.33.1.8"
          },
          IPAddress: "172.33.1.8",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          Links: null,
          MacAddress: "02:42:ac:21:01:08",
          NetworkID:
            "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
        }
      }
    },
    Ports: [
      {
        PrivatePort: 8000,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      },
      {
        PrivatePort: 8080,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      }
    ],
    State: "running",
    Status: "Up 5 weeks"
  },
  {
    Id: "ba4765113dd6016da8b35dfe367493186f3bfd34d88eca03ccf894f7045710fa",
    Names: ["/DAppNodePackage-grafana.dms.dnp.dappnode.eth"],
    Image: "grafana.dms.dnp.dappnode.eth:1.0.1",
    ImageID:
      "sha256:269651b5aa5472d188fda97a937fd0bf861edc7a73122d66591af0e464559f70",
    Command:
      "/run.sh grafana-server --homepath=/usr/share/grafana --config=/etc/grafana/grafana.ini --packaging=docker",
    Created: 1618303536,
    Ports: [
      {
        PrivatePort: 3000,
        Type: "tcp",
        PublicPort: 0,
        IP: "0.0.0.0"
      }
    ],
    Labels: {
      "com.docker.compose.config-hash":
        "2e0732ce7e64078b071b27e65b7d60e4c05913b8e9aa3d7a1f525d7ae80ed5f7",
      "com.docker.compose.container-number": "1",
      "com.docker.compose.oneoff": "False",
      "com.docker.compose.project": "dmsdnpdappnodeeth",
      "com.docker.compose.project.config_files":
        "/usr/src/app/dnp_repo/dms.dnp.dappnode.eth/docker-compose.yml",
      "com.docker.compose.project.working_dir":
        "/usr/src/app/dnp_repo/dms.dnp.dappnode.eth",
      "com.docker.compose.service": "grafana",
      "com.docker.compose.version": "1.25.5",
      "dappnode.dnp.avatar":
        "/ipfs/QmaZZVsVqaWwVLe36HhvKj3QEPt7hM1GL8kemNvsZd5F5x",
      "dappnode.dnp.default.volumes": '["grafana_data:/var/lib/grafana"]',
      "dappnode.dnp.dependencies": "{}",
      "dappnode.dnp.dnpName": "dms.dnp.dappnode.eth",
      "dappnode.dnp.isCore": "false",
      "dappnode.dnp.isMain": "true",
      "dappnode.dnp.serviceName": "grafana",
      "dappnode.dnp.version": "1.0.1"
    },
    State: "running",
    Status: "Up 7 minutes",
    HostConfig: {
      NetworkMode: "dncore_network"
    },
    NetworkSettings: {
      Networks: {
        dncore_network: {
          IPAMConfig: null,
          Links: null,
          Aliases: null,
          NetworkID:
            "e843eba0ca739a4008669e413147785777da160262ed5d46e27e625329c65ce8",
          EndpointID:
            "e072374b357cdef2a5cc8c9581b58c834bd58f9851bf93583fc4f85a2dd61952",
          Gateway: "172.33.0.1",
          IPAddress: "172.33.0.3",
          IPPrefixLen: 16,
          IPv6Gateway: "",
          GlobalIPv6Address: "",
          GlobalIPv6PrefixLen: 0,
          MacAddress: "02:42:ac:21:00:03"
        }
      }
    },
    Mounts: [
      {
        Type: "volume",
        Name: "dmsdnpdappnodeeth_grafana_data",
        Source: "/var/lib/docker/volumes/dmsdnpdappnodeeth_grafana_data/_data",
        Destination: "/var/lib/grafana",
        Driver: "local",
        Mode: "rw",
        RW: true,
        Propagation: ""
      }
    ]
  }
];
