# dappGet

## Introduction

The goal of this module is to prevent breaking the compatibility of versions within installed DAppNode packages (DNPs). It ensures forward compatibility between the dependencies of the current request plus backwards compatility within already installed packages. Due to the size of the DNPs, only one single version of each DNP is installed at once, so all dependants must consume a single version of that dependency.

Emulating Debian's `apt`, this module is split in two stages. The main reason of this split was to have the resolver as a pure function to facilitate its testing.

- `aggregate`: Fetches all necessary information (available versions, depedency relations) to resolves the user's request.
- `resolve`: Pure function that returns a valid combination of versions or the reason of the incompatibility.

## Resolver algorythm

DNPs have a few characteristics which are taken advantage of:

- Very low number of dependencies per DNP (between 0 and 2 on average)
- Dependencies don't tend change during the lifetime of a DNP

Given the complexity of the dependencies relations, the chosen way to solve a request is brute force. The resolver computes all possible version combinations and checks them one by one until it finds a compatible solution. This may seem inefficient but in most cases a valid a combination is found on the very first try (1-5 ms). The following example shows how this process looks like.

Given a specific request, the resolver aggreates all possible versions of requested DNP and its recursive dependencies.

```js
const versionPermutations = [
  { name: "A", versions: ["2.2.0", "2.1.0", "2.0.0"], n: 3, m: 1 },
  { name: "C", versions: ["2.0.0", "1.0.0"], n: 2, m: 3 },
  { name: "D", versions: ["1.1.0", "1.0.0"], n: 2, m: 6 }
];
```

Properties `n` and `m` are use by the permutator to compute each version permutation as such:

```js
const versionPermutation = {};
for (const dnp of versionPermutations) {
  versionPermutation[dnp.name] = dnp.versions[Math.floor(i / dnp.m) % dnp.n];
}
```

In our example, the first combination `i = 1` will produce `versionPermutation = { A: '2.2.0', C: '2.0.0', D: '1.1.0' }`. Now the resolver checks if that combination of versions is actually compatible. Then, it would check:

- A@2.2.0 in within C@2.0.0 dependencies range?
- A@2.2.0 in within D@1.1.0 dependencies range?
- C@2.0.0 in within A@2.2.0 dependencies range?
- C@2.0.0 in within D@1.1.0 dependencies range?
- D@1.1.0 in within A@2.2.0 dependencies range?
- D@1.1.0 in within C@2.0.0 dependencies range?

If all that questions return true, BINGO! the resolver finishes it's job with success. Otherwise, check the next combination `i = 2`. The resolver will return an error if it checks all possible combinations without finding any compatible, or if it times out (currently set to 10 seconds).

## DNP agregation

After explaining the resolver algorythm, notice that it needs a list of DNPs and its possible versions to work with. The goal is to aggreate all possible DNPs in order to find a compatible combination of DNPSs that satisfies the user request and doesn't break compatibility with already installed DNPs. To do so, it first gathers all the dependencies recursively (**forward compatibility**). Then, it checks which installed packages might by affected by the installing packages (**backward compatibility**).

### Forward compatibility

User requests DNP A@1.0.0. The aggregator will fetch the dependencies of A@1.0.0:

```js
A.dependencies = { B: "^1.0.0", C: "/ipfs/QmZcg3..." };
```

Then it will check what versions of B are available that match the semver range `^1.0.0`, for example: `["1.0.0", "1.0.1", "1.1.0"]`. Then, it will repeat the same process fetching the dependencies of `B@1.0.0`, `B@1.0.1` and `B@1.1.0`. The process will continue until the end of the dependency tree, with checks in place to avoid dependency loops.

The resulting list are all possible **but not necessary compatible** combinations of DNPs and versions for the user request.

### Backward compatibility

Follow this practical case to see an example and its implementation

User requests to install DNP A, which depeneds on B. In the DAppNode, the user already has DNPs B, C (which depends on B) and D (which depends on C). Notice that A's dependency on B may cause incompatibilities on packages C and D, so they have to be run through the resolver. To sum up this case:

- Request: A
- Installed packages: B, C, D
- Dependency relations: A => B, B => [], C => B, D => C

The first job of the module is to realise that packages C and D are of insterest to resolve the compatibility of the user's request. To do so it does the following:

1.  Resolve the dependencies of the user's request: `packagesRequested = ["A", "C"]`
2.  Check if any installed package depends on that

```js
packagesRequested = ["A", "C"];
packagesInstalled = ["B", "C", "D"];
// Now interest packagesRequested ∩ packagesInstalled
packagesRequested ∩ packagesInstalled = ["C"]
// Add C to the state packages list and also the packages that depend on C,
(packagesRequested ∩ packagesInstalled).forEach(pkg => {
    addDependants(pkg)
})
function addDependants(pkg) {
    addToState(pkg)
    packagesInstalled.forEach(dependantPkg => {
        // This is recursive function that can generate infinite loops. Prevent them with !packageInState(pkg)
        if (dependantPkg.dependsOn(pkg) && !packageInState(pkg)) {
            addDependants(dependantPkg)
        }
    })
}
// First round will add only C. Second round will see that B => C and add B. Third round will see that D => B and add D.
```

## Types of versions

### APM version

DNPs are managed by an Aragon Package Manager (APM). For a DNP request

```js
{
    name: 'kovan.dnp.dappnode.eth',
    ver: '0.1.0'
}
```

the resolver and the DNP_DAPPMANAGER assume that the ENS domain `kovan.dnp.dappnode.eth` will resolve to an APM contract where the version `[0,1,0]` resolves to the IPFS hash of a valid manifest.

Semver ranges are supported, so for the request

```js
{
    name: 'kovan.dnp.dappnode.eth',
    ver: '^0.1.0'
}
```

the resolver will go to the `kovan.dnp.dappnode.eth` APM, query all versions and return the ones that satisfy the range `^0.1.0`.

### IPFS version

Alternatively, a DNP version can be refered to directly by their IPFS hash

```js
{
    name: 'kovan.dnp.dappnode.eth',
    ver: 'ipfs/QmRJyLJDiHjd1jbDGJsxEvMqcibaYmkkHLQHvDudYpRB6C'
}
```

IPFS versions refer to a specific version, which is found in the manifest after resolving the hash. Unlike regular semver versions (APM versions) these do not support ranges.

Conceptually, (assuming ipfs/QmRJyLJDiHjd1jbDGJsxEvMqcibaYmkkHLQHvDudYpRB6C resolves to version `0.1.1`) the resolver will convert the request above to

```js
{
    name: 'kovan.dnp.dappnode.eth',
    ver: '0.1.1',
    origin: 'ipfs/QmRJyLJDiHjd1jbDGJsxEvMqcibaYmkkHLQHvDudYpRB6C'
}
```

Now the resolver can understand and process this version while tracking its origin to perform the installation latter.

#### IPFS + semver version

> WIP

What happens when a DNP requests `dnp-a@0.1.0` while another requests `dnp-a@ipfs/QmRJyLJDiHjd1jbDGJsxEvMqcibaYmkkHLQHvDudYpRB6C (0.1.0)`? There are two requests for the same semver version but they actually point to different content.

Rules:

- An IPFS version must always have priority and be installed. If `dnp-a@ipfs/QmRJyLJDiHjd1jbDGJsxEvMqcibaYmkkHLQHvDudYpRB6C (0.1.0)` is requested and `dnp-a@0.1.0` is installed, the IPFS version should be installed.
- If `dnp-a@0.1.0` is request and `dnp-a@ipfs/QmRJyLJDiHjd1jbDGJsxEvMqcibaYmkkHLQHvDudYpRB6C (0.1.0)` is installed, the non-IPFS version should be installed.
