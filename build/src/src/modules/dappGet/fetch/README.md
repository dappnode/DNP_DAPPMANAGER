# Fetch module

The fetch module pre-fetches all necessary information so the resolver module is a pure function.
It will fetch the manifests of all package of possible interest.

- Requested package: i.e. kovan.dnp.dappnode.eth@0.1.0 => ["0.1.0"]
- Requested package dependencies: i.e. ipfs.dnp.dappnode.eth@^0.1.0 => ["0.1.0", "0.1.1", "0.1.2"]
- Current state packages and their dependencies which may be updated:

  if A (which depends on C) is about to be installed, then B (which depends on C) becomes a package of interest. Also, D (which depends on B) becomes a package of interest.

  - request: A
  - dependency relations: A => C, B => C, D => B
  - installed packages: B, C, D

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

## Improve speed

The fetch module has proven to be very slow. It fetches versions for:

- the current state
- the request

The current state fetch will return the same results 99% of the time, so it is important to cache it. Also, devs can install wierd versions so the state fetch has to be protected against all possible cases.
