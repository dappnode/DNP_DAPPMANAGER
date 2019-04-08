# Calls

Each call function is a Remote procedure call (RPC) registered to autobahn.js (crossbar). All files return an async function with only one argument (key-word arguments, kwargs) and returns a response object. The kwargs is es6-deconstructed to access the arguments sent by the callee to execute the task.

```javascript
const someCall = async ({ arg1, arg2 }) => {
  /*
   * Call code
   */
  return {
    message: "Successfully did something",
    result
  };
};
```

The response object must always contain a message property and can also contain

- `result`: data to be consumed by the RPC callee
- `logMessage`: boolean flag, the DAPPMANAGER will log the result to its logs.
- `userAction`: boolean flag, the DAPPMANAGER will log the result to the userAction logs.

When registered to autobahn.js, each handler is wrapped with a function. It calls the handler inside a try/catch block and standarizes the response. Autobahn calls its handlers with three arguments:

0.  `args`: an array with call arguments
1.  `kwargs`: an object with call arguments
1.  `details`: an object which provides call metadata

Currently we only use kwargs.

```javascript
const wrapper = (handler) => async function(args, kwargs, details) {

    try {
        const res = await handler(kwargs);

        ...

        // Return to call result
        return JSON.stringify({
            success: true,
            message: res.message,
            result: res.result || {},
        });
    } catch (err) {

        ...

        return JSON.stringify({
            success: false,
            message: err.message,
        });
    }
};
```

# Remote Procedure Calls (RPCs)

---

### diagnose.dappmanager.dnp.dappnode.eth

Returns a list of checks done as a diagnose

#### Returns (result)

A formated list of messages

```js
{
    dockerVersion: {
        name: 'docker version',
        result: 'Docker version 18.06.1-ce, build e68fc7a'
        error: 'sh: docker: not found'
    },
    ...
}
```

---

### diskSpaceAvailable.dappmanager.dnp.dappnode.eth

Returns the current disk space available of a requested path

#### Parameters (kwargs)

- path: {String}

#### Returns (result)

```js
{
  exists: true, { Bool };
  totalSize: "154.54GB", { String };
  availableSize: "7.32GB", { String };
}
```

---

### fetchDirectory.dappmanager.dnp.dappnode.eth

Fetches all package names in the custom dappnode directory.
This feature helps the ADMIN UI load the directory data faster.

#### Returns (result)

```js
[
    {
        name: 'admin.dnp.dappnode.eth', {String}
        status: 'Preparing', {String}
        currentVersion: '0.1.2' or null, {String}
    },
    ...
]
```

---

### fetchPackageData.dappmanager.dnp.dappnode.eth

Fetches the manifest of the latest version and its avatar.
This feature helps the ADMIN UI load the directory data faster.

#### Parameters (kwargs)

- `id`: package .eth name {String}

#### Returns (result)

```js
{
    avatar: {base64 image}, {String}
    manifest: {manifest object}
}
```

---

### fetchPackageVersions.dappmanager.dnp.dappnode.eth

Fetches all available version manifests from a package APM repo

#### Parameters (kwargs)

- `id`: package .eth name {String}

#### Returns (result)

```js
[
    {
        version: '0.0.4', {String}
        manifest: {manifest object} {Object}
    },
    ...
]
```

---

### getStats.dappmanager.dnp.dappnode.eth

Returns the current disk space available of a requested path

#### Returns (result)

```js
{
  cpu: "58%", { String };
  memory: "14%", { String };
  disk: "57%", { String };
}
```

---

### getUserActionLogs.dappmanager.dnp.dappnode.eth

Returns the user action logs. This logs are stored in a different
file and format, and are meant to ease user support

#### Parameters (kwargs)

- `options`: {Object}

#### Returns (result)

Unparsed logs

```js
logs {String}
```

---

### installPackage.dappmanager.dnp.dappnode.eth

Installs a package. It resolves dependencies, downloads
manifests and images, loads the images to docker, and calls
docker up on each package.
It has extra functionality for special cases
allowCore: If a manifest requests a package to be core
it will only be granted if

1.  Its manifest comes from APM and .dnp.dappnode.eth
2.  It comes from IPFS and the BYPASS_CORE_RESTRICTION env is true
    Special versions: It needs to deal with two cases
3.  ver = 'latest'
4.  ver = '/ipfs/QmZ87fb2...'

#### Parameters (kwargs)

- `id`: package .eth name {String}
- `userSetVols`: user set volumes {Object}

```js
{
    "kovan.dnp.dappnode.eth": {
        "kovan:/root/.local/share/io.parity.ethereum/": "different_name"
    },
    ...
}
```

- `userSetPorts`: user set ports {Object}

```js
{
    "kovan.dnp.dappnode.eth": {
        "30303": "31313:30303",
        "30303/udp": "31313:30303/udp"
    },
    ...
}
```

- `logId`: task id used for publishing progressive updates {String}

---

### listPackages.dappmanager.dnp.dappnode.eth

Returns the list of current containers associated to packages

#### Returns (result)

```js
[
    {
        created: "2019-01-12T16:55:18.000Z"
        envs: {
            EXTRA_OPTS: "--enable-pubsub-experiment"
        }
        dependencies: {dependency.dnp.dappnode.eth: "latest"}
        id: "591e074a9ae8eaaf1ac3f73b74d838ec2c7347afeb1c6e538485f9eb5b7f6626"
        image: "ipfs.dnp.dappnode.eth:0.1.4"
        isCORE: true
        isDNP: false
        manifest: {manifest object}
        name: "ipfs.dnp.dappnode.eth"
        packageName: "DAppNodeCore-ipfs.dnp.dappnode.eth"
        ports: [
            {IP: "0.0.0.0", PrivatePort: 4001, PublicPort: 4001, Type: "tcp"}
            {IP: "0.0.0.0", PrivatePort: 4002, PublicPort: 4002, Type: "udp"}
            {PrivatePort: 5001, Type: "tcp"}
            {PrivatePort: 8080, Type: "tcp"}
            {PrivatePort: 8081, Type: "tcp"}
        ]
        portsToClose: []
        running: true
        shortName: "ipfs"
        state: "running"
        version: "0.1.4"
        volumes: [
            {
                links: "1"
                name: "dncore_ipfsdnpdappnodeeth_data"
                path: "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_data/_data"
                size: "337.2MB"
                type: "volume"
            },
            {
                links: "1"
                name: "dncore_ipfsdnpdappnodeeth_export"
                path: "/var/lib/docker/volumes/dncore_ipfsdnpdappnodeeth_export/_data"
                size: "0B"
                type: "volume"
            }
        ]
        ...
    },
    ...
]
```

---

### logPackage.dappmanager.dnp.dappnode.eth

Returns the logs of the docker container of a package

#### Parameters (kwargs)

- `id`: package .eth name {String}
- `options`: log options {Object}

#### Returns (result)

Returns the DNP `id` logs within the `options` constrains as an unparsed string with espace codes.

```js
{
    id: "ipfs.dnp.dappnode.eth", {String}
    logs: "172.33.10.1 - - [10/Jan/2019:16:54:08 +0000] \"GET / HTTP/1.1\" 200 79" {String}
}
```

---

### managePorts.dappmanager.dnp.dappnode.eth

Open or closes requested ports

#### Parameters (kwargs)

- `id`: package .eth name {String}
- `action`: 'open' or 'close' {String}
- `ports`: array of port objects

```js
ports = [
    { number: 30303, type: TCP },
    ...
]
```

---

### notificationsGet.dappmanager.dnp.dappnode.eth

Returns not viewed notifications

#### Returns (result)

```js
{
    "diskSpaceRanOut-stoppedPackages": {
        id: 'diskSpaceRanOut-stoppedPackages',
        type: 'error',
        title: 'Disk space ran out, stopped packages',
        body: `Available disk space is less than a safe ...`,
    },
    ...
}
```

---

### notificationsRemove.dappmanager.dnp.dappnode.eth

Marks notifications as view by deleting them from the db

#### Parameters (kwargs)

- `ids`: package .eth name {Array}

```js
ids: ["diskSpaceRanOut-stoppedPackages", "diskSpaceRanOut-stoppedPackages2"];
```

---

### removePackage.dappmanager.dnp.dappnode.eth

Remove package data: docker down + disk files

#### Parameters (kwargs)

- `id`: package .eth name {String}
- `deleteVolumes`: flag to also clear permanent package data

---

### requestChainData.dappmanager.dnp.dappnode.eth

Requests chain data. Also instructs the DAPPMANAGER
to keep sending data for a period of time

---

### resolveRequest

Resolves the dependencies of a package request

#### Parameters (kwargs)

- `req`: package request {String}

```js
{
    name: 'otpweb.dnp.dappnode.eth', {String}
    ver: '0.1.4' {String}
}
```

- `options`: {Object}

#### Returns (result)

DappGet result object. Refer to the dappGet documentation.

```js
{
    success: {
        'bind.dnp.dappnode.eth': '0.1.4',
        'core.dnp.dappnode.eth': '/ipfs/Qmabuy2rTUEWA5jKyUKJmUDCH375e75tpUnAAwyi1PbLq1'
    },
    message: 'Found compatible state with case 1/256',
 }
```

---

### restartPackage.dappmanager.dnp.dappnode.eth

Calls docker rm and docker up on a package

#### Parameters (kwargs)

- `id`: package .eth name {String}

---

### restartPackageVolumes.dappmanager.dnp.dappnode.eth

Removes a package volumes. The re-ups the package

#### Parameters (kwargs)

- `id`: package .eth name {String}

---

### togglePackage.dappmanager.dnp.dappnode.eth

Stops or starts after fetching its status

#### Parameters (kwargs)

- `id`: package .eth name {String}
- `timeout`: seconds to stop the package {Integer}

---

### updatePackageEnv.dappmanager.dnp.dappnode.eth

Updates the .env file of a package. If requested, also re-ups it

#### Parameters (kwargs)

- `id`: package .eth name {String}
- `envs`: enviroment variables {Object}
- `isCore`: {Boolean}
- `restart`: flag to restart the package {Boolean}
