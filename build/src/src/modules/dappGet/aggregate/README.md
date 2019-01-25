# Aggregate

Aggregates all relevant packages and their info given a specific request. The resulting "repo" (dnps) can be run directly through a brute force resolver as it only includes DNPs of interest to that specific user request

## Usage

```javascript
const dnps = await aggregate(req)
```

### Arguments

The package request

```javascript
// Arguments
const req = {
  name: "nginx-proxy.dnp.dappnode.eth",
  ver: "^0.1.0"
};
```

### Returns

Local repo of packages of interest that may be installed. They include the name of the package, their versions and dependencies and a tag:

- isRequest
- isInstalled
  The tags are used latter to order the packages in order to minimize the number of attempts to find a valid solutions

```javascript
dnps = {
  "dependency.dnp.dappnode.eth": {
    versions: {
      "0.1.1": {},
      "0.1.2": {}
    }
  },
  "letsencrypt-nginx.dnp.dappnode.eth": {
    isInstalled: true,
    versions: {
      "0.0.4": { "web.dnp.dappnode.eth": "latest" }
    }
  },
  "nginx-proxy.dnp.dappnode.eth": {
    isRequest: true,
    versions: {
      "0.0.3": { "nginx-proxy.dnp.dappnode.eth": "latest" }
    }
  },
  "web.dnp.dappnode.eth": {
    isInstalled: true,
    versions: {
      "0.0.0": { "letsencrypt-nginx.dnp.dappnode.eth": "latest" }
    }
  }
};
```
