const expect = require("chai").expect;
const parseDockerSystemDf = require("utils/parseDockerSystemDf");

const data = {
  Volumes: [
    {
      Name: "dncore_vpndnpdappnodeeth_data",
      Driver: "local",
      Mountpoint: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data",
      Labels: null,
      Scope: "local",
      Options: null,
      UsageData: {
        Size: 10920104,
        RefCount: 2
      }
    }
  ]
};

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
  it("should parse dockerSystemDf output", () => {
    const res = parseDockerSystemDf({ data: data });
    expect(res).to.deep.equal({
      dncore_vpndnpdappnodeeth_data: { links: 2, size: 10920104 }
    });
  });

  it("should extend the dnpList", () => {
    const res = parseDockerSystemDf({
      data,
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
            links: 2,
            size: 10920104
          }
        ]
      }
    ]);
  });
});
