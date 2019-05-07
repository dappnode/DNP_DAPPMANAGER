const expect = require("chai").expect;
const parseDockerSystemDf = require("utils/parseDockerSystemDf");

const output = `Images space usage:

REPOSITORY                     TAG                 IMAGE ID            CREATED ago         SIZE                SHARED SIZE         UNIQUE SiZE         CONTAINERS
ethchain.dnp.dappnode.eth      0.1.9               19746105ebb3        8 days ago ago      63.55MB             4.413MB             59.13MB             1
dappmanager.dnp.dappnode.eth   0.1.16              a470839e3988        8 days ago ago      215.4MB             0B                  215.4MB             1
vpn.dnp.dappnode.eth           0.1.19              2f4fccb3569d        9 days ago ago      262.3MB             4.413MB             257.9MB             1
ipfs.dnp.dappnode.eth          0.1.4               a5ec15c0d3f6        9 days ago ago      43.17MB             0B                  43.17MB             1
admin.dnp.dappnode.eth         0.1.13              4b5c9c185805        3 weeks ago ago     28.05MB             0B                  28.05MB             1
swarm.dnp.dappnode.eth         0.0.1               0f893bccb52b        3 weeks ago ago     98.19MB             4.148MB             94.04MB             1
ethforward.dnp.dappnode.eth    0.1.2               bcfc25920e38        3 months ago ago    81.44MB             4.148MB             77.29MB             1
bind.dnp.dappnode.eth          0.1.5               06311ca6e86d        3 months ago ago    9.096MB             4.148MB             4.948MB             1
wamp.dnp.dappnode.eth          0.1.0               08675803ea57        5 months ago ago    170.5MB             4.148MB             166.4MB             1

Containers space usage:

CONTAINER ID        IMAGE                                 COMMAND                  LOCAL VOLUMES       SIZE                CREATED ago         STATUS              NAMES
63579529767c        swarm.dnp.dappnode.eth:0.0.1          "/bin/sh -c 'bash ..."   1                   1B                  32 hours ago ago    Up 32 hours         DAppNodePackage-swarm.dnp.dappnode.eth
894c45aa4afc        vpn.dnp.dappnode.eth:0.1.19           "supervisord"            1                   114kB               36 hours ago ago    Up 36 hours         DAppNodeCore-vpn.dnp.dappnode.eth
220fd042ed11        ethforward.dnp.dappnode.eth:0.1.2     "/bin/sh -c 'node ..."   0                   0B                  36 hours ago ago    Up 36 hours         DAppNodeCore-ethforward.dnp.dappnode.eth
be6e7a8f47d1        ethchain.dnp.dappnode.eth:0.1.9       "/bin/sh -c 'parit..."   1                   0B                  36 hours ago ago    Up 36 hours         DAppNodeCore-ethchain.dnp.dappnode.eth
835cf021ceee        dappmanager.dnp.dappnode.eth:0.1.16   "/bin/sh -c /usr/s..."   1                   758kB               36 hours ago ago    Up 36 hours         DAppNodeCore-dappmanager.dnp.dappnode.eth
775f6707cdaf        ipfs.dnp.dappnode.eth:0.1.4           "/sbin/tini -- /us..."   2                   0B                  36 hours ago ago    Up 36 hours         DAppNodeCore-ipfs.dnp.dappnode.eth
2d13251e9f60        admin.dnp.dappnode.eth:0.1.13         "nginx -g 'daemon ..."   0                   2B                  36 hours ago ago    Up 36 hours         DAppNodeCore-admin.dnp.dappnode.eth
8cd07f90dfef        bind.dnp.dappnode.eth:0.1.5           "/bin/sh -c '/usr/..."   1                   104B                36 hours ago ago    Up 36 hours         DAppNodeCore-bind.dnp.dappnode.eth
d1eaa239d474        wamp.dnp.dappnode.eth:0.1.0           "crossbar start --..."   1                   0B                  36 hours ago ago    Up 36 hours         DAppNodeCore-wamp.dnp.dappnode.eth

Local Volumes space usage:

VOLUME NAME                                                        LINKS               SIZE
dncore_binddnpdappnodeeth_data                                     1                   10.52kB
dncore_ipfsdnpdappnodeeth_export                                   1                   0B
dncore_ipfsdnpdappnodeeth_data                                     1                   40.44MB
dncore_ethchaindnpdappnodeeth_data                                 1                   142.3GB
dncore_vpndnpdappnodeeth_data                                      1                   866B
dncore_dappmanagerdnpdappnodeeth_data                              1                   1.319kB
swarmdnpdappnodeeth_swarm                                          1                   2.72MB
`;

const dockerListOutput = [
  {
    volumes: [
      {
        name: undefined,
        type: "bind",
        path: "/etc/hostname"
      },
      {
        type: "volume",
        name: "dncore_vpndnpdappnodeeth_data",
        path: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data"
      }
    ]
  }
];

describe("Util: parseDockerSystemDf", function() {
  // before(() => {
  //   validate.path(DOCKERCOMPOSE_PATH);
  //   fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeData);
  //   validate.path(DOCKERCOMPOSE_PATH2);
  //   fs.writeFileSync(DOCKERCOMPOSE_PATH2, dockerComposeData2);
  // });

  it("should parse dockerSystemDf output", () => {
    const res = parseDockerSystemDf({ data: output });
    expect(res).to.deep.equal({
      dncore_binddnpdappnodeeth_data: { links: "1", size: "10.52kB" },
      dncore_ipfsdnpdappnodeeth_export: { links: "1", size: "0B" },
      dncore_ipfsdnpdappnodeeth_data: { links: "1", size: "40.44MB" },
      dncore_ethchaindnpdappnodeeth_data: { links: "1", size: "142.3GB" },
      dncore_vpndnpdappnodeeth_data: { links: "1", size: "866B" },
      dncore_dappmanagerdnpdappnodeeth_data: { links: "1", size: "1.319kB" },
      swarmdnpdappnodeeth_swarm: { links: "1", size: "2.72MB" }
    });
  });

  it("should extend the dnpList", () => {
    const res = parseDockerSystemDf({
      data: output,
      dnpList: dockerListOutput
    });
    expect(res).to.deep.equal([
      {
        volumes: [
          {
            name: undefined,
            type: "bind",
            path: "/etc/hostname"
          },
          {
            type: "volume",
            name: "dncore_vpndnpdappnodeeth_data",
            path: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data",
            links: "1",
            size: "866B"
          }
        ]
      }
    ]);
  });
});
