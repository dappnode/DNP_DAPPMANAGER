module.exports = {
  name: "normal case",
  req: {
    name: "nginx-proxy.dnp.dappnode.eth",
    ver: "^0.1.1"
  },
  expectedState: {
    "nginx-proxy.dnp.dappnode.eth": "0.1.1"
  },
  dnps: {
    "web.dnp.dappnode.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.0": {
          dependencies: {
            "nginx-proxy.dnp.dappnode.eth": "latest",
            "letsencrypt-nginx.dnp.dappnode.eth": "latest"
          }
        }
      }
    },
    "nginx-proxy.dnp.dappnode.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.1": {
          dependencies: { "nginx-proxy.dnp.dappnode.eth": "latest" }
        },
        "0.1.0": {
          dependencies: { "nginx-proxy.dnp.dappnode.eth": "latest" }
        }
      }
    },
    "letsencrypt-nginx.dnp.dappnode.eth": {
      installed: "0.0.4",
      versions: {
        "0.0.4": {
          dependencies: { "web.dnp.dappnode.eth": "latest" }
        }
      }
    }
  }
};
