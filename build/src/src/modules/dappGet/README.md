# dappGet

## Introduction

The goal of this module is to prevent breaking the compatibility of versions within installed DAppNode packages (DNPs). It ensures forward compatibility between the dependencies of the current request plus backwards compatility within already installed packages. Due to the size of the DNPs, only one single version of each DNP is installed at once, so all dependants must consume a single version of that dependency.

Emulating Debian's `apt`, this module is split in two stages. The main reason of this split was to have the resolver as a pure function to facility its testing.

- `fetch`: Fetches all necessary information (available versions, depedency relations) to resolves the user's request.
- `resolver`: Pure function that returns a valid combination of versions or the reason of the incompatibility.

## Resolver algorythm

DNPs have a few characteristics which are taken advantage of:

- Very low number of dependencies per DNP (between 0 and 2 on average)
- Dependencies don't tend change during the lifetime of a DNP

Given the complexity of the dependencies relations, the chosen way to solve a request is brute force. The resolver computes all possible version combinations and checks them one by one until it finds a compatible solution. This may seem inefficient but in most cases a valid a combination is found on the very first try (1-5 ms). The following example shows how this process looks like.

Given a specific request, the resolver aggreates all possible versions of requested DNP and its recursive dependencies.

```javascript
const versionPermutations = [
  { name: "A", versions: ["2.2.0", "2.1.0", "2.0.0"], n: 3, m: 1 },
  { name: "C", versions: ["2.0.0", "1.0.0"], n: 2, m: 3 },
  { name: "D", versions: ["1.1.0", "1.0.0"], n: 2, m: 6 }
];
```

Properties `n` and `m` are use by the permutator to compute each version permutation as such:

```javascript
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

```javascript
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

```javascript
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

===============

## Implementation details

### Deal with non-semver versions

package:dev versions where breaking the resolver.

### Fetch process may be slow

The fetch process is very slow. It was caused by 2 faulty versions of the bind.dnp.dappnode.eth package. As they were never returning a manifest, they were never cached, and the error was repeated every fetch.

- Fetch only state packages that matter. Run a similar code to `appendStatePackages` to only fetch those that have dependencies of to be installed packages.
- Rewrite the data flow. Before it was `fetch(state) -> repo && fetch(req) -> repo`, `(repo, state) -> resolver`. Now do `fetch(state) + repo -> resolver`, to take advantage of filtering according to the package's state.
- Rewrite the resolver `appendStatePackages` to tolerate and ignore missing packages

### How to compute the cause of an incompatibility

In the cases shown above, the user would see an error stating:

```
Faulty response object
```

# Implementation

- The versions are stored in the repo.json as 0.1.0 and /ipfs/Qm.
- The fetch part works almost equally for semver and ipfs versions. It just accumulates version data for both cases.
  - fetch/fetchState.js: if the state version is ipfs, don't look for greater versions.
- The resolver part has heavy custom logic to deal with ipfs versions:
  - resolver/getPkgsToInstall.js: if an ipfs version is requested it will only load that. Otherwise it will load any non-ipfs version that satisfies the requested version. This is necessary to re-patch the safeSemver.satisfies function. Without this extra condition it would be impossible to install non-ipfs versions if ipfs versions are available, because they have priority.
  - appendStatePkgToInstall.js: if the state version is ipfs, don't look for greater versions.
- The resolver use custom semver functions to deal with IPFS versions. They are in utils/safeSemver.js, and add extra conditions to the semver js library:
  - semver.satisfies: 1. an IPFS version satisfies any range, 2. an IPFS range only allows that exact version, 3. Invalid versions and ranges return false
  - semver.rcompare & semver.compare: 1. Put IPFS versions the first, 2. Put invalid versions the latest

# Problems

Semver is not as friendly as I thought with 0.1.0-something versions.

```javascript
semver.satisfies("0.1.1-ipfs-Qm", "*"); // returns false
semver.satisfies("0.1.1-ipfs-Qm", "^0.1.0"); // returns false
semver.satisfies("0.1.1-ipfs-Qm", ">=0.1.0"); // returns true
```

# Solution

- In the repo.json, versions will be stored as /ipfs/Qm.
- The fetch part of dappGet will treat IPFS versions as /ipfs/Qm.
- The resolver part of dappGet will code IPFS versions from /ipfs/Qm to 0.2.0-ipfs-Qm to be able to use semver. Also it will decode them to /ipfs/Qm to fetch the info in the repo.

# Lifetime of a package

- Origin idea: In the docker-compose (and the manifest maybe), there will be a tag with origin=/ipfs/QmZa44. If the origin tag is not present, the origin is APM. Anywhere else, the version of the package is the one stated in the manifest
- 0.2.0-ipfs-Qm:
- /ipfs/Qm:

1.  Gets pick out by a dappGet-update. Then it is stored in the repo.json. How is the version stored?

- Origin idea: Store the version as the semver in the manifest
- 0.2.0-ipfs-Qm: As 0.2.0-ipfs-Qm. ### This version will be considered by subsequent versions as valid, but it is just a test that some developer has done.
- /ipfs/Qm: As /ipfs/Qm

2.  Is is used in the dappGet-resolve, to do semver checks and validate DAppNode's state versions

- Origin idea: No prob, the version is semver
- 0.2.0-ipfs-Qm: No prob, is semver
- /ipfs/Qm: ### Would need to add custom logic to it

3.  It is installed, and its version is part of the image name. It has to be validated if type=dncore (only done once).

- Origin idea: Just use the manifest in the repo? Then it contains the fromIpfs / origin field to check against
- 0.2.0-ipfs-Qm: Stored in the version name
- /ipfs/Qm: Stored in the version name

4.  Another package is installed and the current version of the package is derived from the image and used to validate DAppNode's state versions

- Origin idea: ### It should pick that it is an IPFS version and don't look at other versions, locking it if so.
- 0.2.0-ipfs-Qm: No prob, it's semver.
- /ipfs/Qm: ### How to?

state packages:

1.  Get current list of state packages
2.  Get their dependencies
3.  Crosscheck with the request to see if there is any dependency of interest

4.  The same package is updated and its current version is used to determine if it should be updated or it has the same version

- Origin idea: If you want to install the same version you should remove it first
- 0.2.0-ipfs-Qm: Perfect!
- /ipfs/Qm: ### ?? ipfs versions should always be replaced?

# IPFS versions

Constraints:

- Work with the repo.json file format. This prevents the file from having two fields: hash, deps
- Be able to work when a package has an IPFS dependency. This makes it very hard to use 0.1.3-ipfs-Qmsazz
- Be compatible with the current resolver. It relies heavily on semver so versions = /ipfs/QmZ completely break it

## State version:

- Packages installed from /ipfs/ versions will have an
- The image to be used is defined in the docker-compose, which is generated in the DAPPMANAGER. The function is called in the package.download during the installation, providing the manifest created by the developer of the package:

```javascript
// utils/generate.js line 32
service.image = dpnManifest.name + ":" + dpnManifest.version;
```

- The state version is picked by listing the containers and parsing their image:

```javascript
// modules/dockerList.js line 73
package.version = c.Image.split(':')[1] || '0.0.0',
```

- So in order to know that a package came from IPFS, the manifest should be edited.

## When do they appear?

- As the version for the requested package
- As the version of a package dependency:
  - Done in fetch/getPkgDeps.js line 53
- As

## IPFS case

```
state:
A@/ipfs/Qm -> B@0.1.8
install:
C@0.2.0 -> B@0.1.9
```
