const expect = require("chai").expect;

const getNamedOwnedVolumes = require("utils/getNamedOwnedVolumes");

const dnpList = [
  {
    name: "vipnode.dnp.dappnode.eth",
    volumes: [
      {
        dest: "/app/.ethchain",
        name: "dncore_ethchaindnpdappnodeeth_data",
        path:
          "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
        type: "volume"
      }
    ]
  },
  {
    name: "ethchain.dnp.dappnode.eth",
    volumes: [
      {
        dest: "/root/.local/share/io.parity.ethereum",
        name: "dncore_ethchaindnpdappnodeeth_data",
        path:
          "/var/lib/docker/volumes/dncore_ethchaindnpdappnodeeth_data/_data",
        type: "volume"
      }
    ]
  },
  {
    name: "nginx-proxy.dnp.dappnode.eth",
    volumes: [
      {
        dest: "/usr/share/nginx/html",
        name: "nginxproxydnpdappnodeeth_html",
        path: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
        type: "volume"
      },
      {
        dest: "/etc/nginx/certs",
        path: "/root/certs",
        type: "bind"
      },
      {
        dest: "/etc/nginx/dhparam",
        name:
          "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
        path: "",
        type: "volume"
      },
      {
        dest: "/etc/nginx/vhost.d",
        name: "nginxproxydnpdappnodeeth_vhost.d",
        path: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
        type: "volume"
      },
      {
        dest: "/tmp/docker.sock",
        path: "/var/run/docker.sock",
        type: "bind"
      }
    ]
  },
  {
    name: "letsencrypt-nginx.dnp.dappnode.eth",
    volumes: [
      {
        dest: "/var/run/docker.sock",
        path: "/var/run/docker.sock",
        type: "bind"
      },
      {
        dest: "/etc/nginx/certs",
        path: "/root/certs",
        type: "bind"
      },
      {
        dest: "/etc/nginx/vhost.d",
        name: "nginxproxydnpdappnodeeth_vhost.d",
        path: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
        type: "volume"
      },
      {
        dest: "/usr/share/nginx/html",
        name: "nginxproxydnpdappnodeeth_html",
        path: "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_html/_data",
        type: "volume"
      },
      {
        dest: "/usr/share/nginx/data",
        name: "letsencryptnginxdnpdappnodeeth_data",
        path:
          "/var/lib/docker/volumes/letsencryptnginxdnpdappnodeeth_data/_data",
        type: "volume"
      }
    ]
  }
];

describe("Utils > getNamedOwnedVolumes", () => {
  const tests = [
    {
      id: "letsencrypt-nginx.dnp.dappnode.eth",
      result: [
        {
          name: "letsencryptnginxdnpdappnodeeth_data",
          dnpsToRemove: []
        }
      ],
      resultWithAggregate: {
        names: ["letsencryptnginxdnpdappnodeeth_data"],
        dnpsToRemove: []
      }
    },
    {
      id: "nginx-proxy.dnp.dappnode.eth",
      result: [
        {
          name: "nginxproxydnpdappnodeeth_html",
          dnpsToRemove: ["letsencrypt-nginx.dnp.dappnode.eth"]
        },
        {
          name:
            "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
          dnpsToRemove: []
        },
        {
          name: "nginxproxydnpdappnodeeth_vhost.d",
          dnpsToRemove: ["letsencrypt-nginx.dnp.dappnode.eth"]
        }
      ],
      resultWithAggregate: {
        names: [
          "nginxproxydnpdappnodeeth_html",
          "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
          "nginxproxydnpdappnodeeth_vhost.d"
        ],
        dnpsToRemove: ["letsencrypt-nginx.dnp.dappnode.eth"]
      }
    },
    {
      id: "ethchain.dnp.dappnode.eth",
      result: [
        {
          name: "dncore_ethchaindnpdappnodeeth_data",
          dnpsToRemove: ["vipnode.dnp.dappnode.eth"]
        }
      ],
      resultWithAggregate: {
        names: ["dncore_ethchaindnpdappnodeeth_data"],
        dnpsToRemove: ["vipnode.dnp.dappnode.eth"]
      }
    },
    {
      id: "vipnode.dnp.dappnode.eth",
      result: [],
      resultWithAggregate: {
        names: [],
        dnpsToRemove: []
      }
    }
  ];
  for (const { id, result, resultWithAggregate } of tests) {
    it(`Should return namedOwnedVolumes for ${id}`, () => {
      expect(getNamedOwnedVolumes(dnpList, id)).to.deep.equal(result);
    });
    it(`Should return namedOwnedVolumes with aggregate: true for ${id}`, () => {
      expect(
        getNamedOwnedVolumes(dnpList, id, { aggregate: true })
      ).to.deep.equal(resultWithAggregate);
    });
  }
});
