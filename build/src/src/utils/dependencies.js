const semver = require('semver');
const versions = require('utils/versions');
const validate = require('utils/validate');
const dockerListDefault = require('modules/dockerList');
const parse = require('utils/parse');
const logUI = require('utils/logUI');
const logs = require('logs.js')(module);


const BYPASS_CORE_RESTRICTION = process.env.BYPASS_CORE_RESTRICTION;


function createGetAllResolvedOrdered(getManifest,
  dockerList=dockerListDefault) {
  return async function getAllResolvedOrdered({packageReq, logId}) {
    logUI({logId, clear: true, msg: 'fetching dependencies...'});
    let allResolvedDeps = await getAllResolved(packageReq, getManifest);
    // Dependencies will be ordered so they can be installed in series
    // let allResolvedOrdered = orderDependencies(allResolvedDeps);
    logUI({logId, order: allResolvedDeps.map((p) => p.name)});

    // Check which dependencies should be installed
    let allResolvedOrderedChecked = await shouldInstall(allResolvedDeps, dockerList, logId);
    return allResolvedOrderedChecked;
  };
}


async function shouldInstall(packageList, dockerList, logId) {
  // This function verifies if vcurrent < vreq
  // otherwise, splices out the package of the list
  const dnpList = await dockerList.listContainers();

  return packageList.filter((packageReq) => {
    const packageCurrent = dnpList.filter((c) => c.name == packageReq.name)[0];

    // If there is no current package, install
    if (!packageCurrent) return true;

    // Otherwise, compare verions
    const requestedVersion = packageReq.manifest.version;
    const currentVersion = packageCurrent.version;

    logs.info('COMPARING '+packageReq.name+' REQ: '+requestedVersion+' CURRENT '+currentVersion);
    if (semver.lt(currentVersion, requestedVersion)) {
      return true;
    } else {
      logUI({logId, pkg: packageReq.name, msg: 'Already updated'});
      logs.info('IGNORING PACKAGE: '+packageReq.name);
      return false;
    }
  });
}


async function getAllResolved(packageReq, getManifest) {
  // Inputs
  //  [1] packageReq = object, i.e {name: 'myPackage', ver: '1.2.3'}
  //  [2] getManifest = async function: must return a manifest parsed object
  // Specs
  //  - It will fetch dependencies recursively until filling the whole tree
  //  - !! It will attach the fetched manifest in the package object
  // Output
  //
  //   allResolvedDeps = [
  //     {
  //       name: 'myPackage'
  //       ver: '1.3.5'
  //       dep: <dep object>
  //       manifest: <manifest object>
  //     },
  //   ...
  //   ]

  // getAll resolves dependencies, prevents duplication and ignores circular dependencies
  let dependencies = await getAll(packageReq, getManifest);
  // getAll will return an object:
  // dependencies = {
  //   packageA: {
  //     name: 'packageA',
  //     ver: '0.0.1',
  //     dep: {
  //       packageB: '0.0.2'
  //     }
  //   },
  //   ...
  // }

  // You need to return an array:
  return Object.values(dependencies);
}


async function getAll(packageReq, getManifest, dependencies={}) {
  // Parse request


  // Expects packageReq = {name: packageName, ver: packageVersion}
  // >> Will attach the fetched manifest
  let manifest = await getManifest(packageReq);
  // Validate the input, manifests are not controlled by the dappnode team
  // Basically returns manifest.dependencies
  let depObject = parse.manifest.depObject(manifest);


  // Depobject can have the following formats
  // {
  //   dappmanager.dnp.dappnode.eth: "latest", -> Fetch latest from APM
  //   dappmanager.dnp.dappnode.eth: "0.4.1", -> Fetch version from APM
  //   dappmanager.dnp.dappnode.eth: "/ipfs/Qm...", -> Fetch straight from IPFS
  //   dappmanager.dnp.dappnode.eth: "fake" -> Throw error
  // }

  // Logic to allow core or not
  const allowCORE = (packageReq.name.endsWith('.dnp.dappnode.eth') || BYPASS_CORE_RESTRICTION);

  // Correct packageReq name in case it is a hash
  // > must be done here before the dependency loop prevention
  if (validate.isIPFShash(packageReq.name)) {
    packageReq.name = manifest.name;
  }

  // Add the current dep to the packageList, before fetching its sub dependencies
  const packageReturnObject = {
    name: packageReq.name,
    ver: packageReq.ver,
    dep: depObject,
    manifest: manifest,
  };
  if (allowCORE) packageReturnObject.allowCORE = allowCORE;

  dependencies[packageReq.name] = packageReturnObject;

  for (const depName of Object.getOwnPropertyNames(depObject)) {
    const depVersion = depObject[depName];

    // If the dependency requested is not in the list or the requested
    // version is higher than the stored, proceed to fetch it.
    // Otherwise ignore it.
    if (
      // Either the dependency hasn't been fetched yet
      !dependencies.hasOwnProperty(depName)
      || (
        // or the requested version is higher than the stored
        dependencies.hasOwnProperty(depName)
        && versions.isHigher(depVersion, dependencies[depName].ver)
      )
    ) {
      // Fetch subdependencies of the dependencies recursively
      let subDepReq = {
        name: depName,
        ver: depVersion,
      };
      await getAll(subDepReq, getManifest, dependencies);
    }
  }
  return dependencies;
}


function resolveConflictingVersions(dependencyList) {
  let highestDepVer = {};
  dependencyList.map((dep) => {
    // Keep rewritting the highest version on the object
    highestDepVer[dep.name] = versions.highestVersion(dep.ver, highestDepVer[dep.name]);
  });

  // highestDependencyVersion contains a unique list of dep names
  return dependencyList
    .filter(byUniqueObjects)
    .filter((dep) => highestDepVer[dep.name] == dep.ver);
}


// /////////////////////
// Dedicated utilities


function byUniqueObjects(obj, index, arr) {
  return arr
    .map((_obj) => String(_obj.name+'@'+_obj.ver)).indexOf(String(obj.name+'@'+obj.ver)) === index;
}


function sortByNameKey(a, b) {
  if (a.name < b.name)
    {return -1;}
  if (a.name > b.name)
    {return 1;}
  return 0;
}


module.exports = {
  createGetAllResolvedOrdered,
  getAll,
  getAllResolved,
  sortByNameKey,
  byUniqueObjects,
  resolveConflictingVersions,
};
