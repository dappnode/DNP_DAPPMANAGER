const { highestVersion } = require('../utils/versions')
// function getAllDependencies(pac) {
//   // Expects a package request: package@version
//   // It will fetch dependencies recursively until filling the whole tree
//   let dependencyList = await getAll (packageReq);
//
// }

// A package manifest has this format:
// {
//   ...
//   "dependencies": {
//     "nginx-proxy.dnp.dappnode.eth": "latest"
//   }
// }

// Default fecthDependencies
// async function fetchDependencies(packageReq) {
//   let dnpManifest = await getManifest(packageReq);
//   return dnpManifest.dependencies;
// }

async function getAllResolvedDeps(packageReq, fetchDependencies) {

  let dependencyList = await getAllDeps(packageReq, fetchDependencies)
  // The dependecy list may contain the same package with different versions
  return resolveConflictingVersions(dependencyList)

}


async function getAllDeps(packageReq, fetchDependencies, packageList=[]) {
  let depObject = await fetchDependencies(packageReq);

  // Validate the input, manifests are not controlled by the dappnode team
  let dep = [];
  if ( !depObject || typeof(depObject) != typeof({}) ) {
    throw Error('BROKEN DEPENDENCY OBJECT, of package: '+JSON.stringify(packageReq)+' depObject: '+depObject)
  }

  // Using a for loop instead of map or forEach to avoid hiding this code
  // and its errors inside a different function
  for (const depName of Object.getOwnPropertyNames(depObject)) {

    // Prevent dependency loops
    if (packageReq.name == depName) {
      throw Error('DEPENDENCY LOOP FOUND, successfully prevented')
    }

    // Fetch subdependencies of the dependencies
    let subDepReq = {
      name: depName,
      ver: depObject[depName]
    }
    await getAllDeps(subDepReq, fetchDependencies, packageList)

  }

  // Add dep to the packageList
  packageList.push({
    name: packageReq.name,
    ver: packageReq.ver,
    dep: depObject
  })
  return packageList

}


function resolveConflictingVersions(dependencyList) {

  let highestDepVer = {}
  dependencyList.map((dep) => {
    // Keep rewritting the highest version on the object
    highestDepVer[dep.name] = highestVersion(dep.ver, highestDepVer[dep.name])
  })

  // highestDependencyVersion contains a unique list of dep names
  return dependencyList
    .filter(byUniqueObjects)
    .filter(dep => highestDepVer[dep.name] == dep.ver)

}


///////////////////////
// Dedicated utilities


function byUniqueObjects(obj, index, arr) {
  return arr.map(_obj => String(_obj.name+'@'+_obj.ver)).indexOf(String(obj.name+'@'+obj.ver)) === index;
}


function sortByNameKey(a,b) {
  if (a.name < b.name)
    return -1;
  if (a.name > b.name)
    return 1;
  return 0;
}


module.exports = {
  getAllDeps,
  sortByNameKey,
  byUniqueObjects,
  resolveConflictingVersions,
  getAllResolvedDeps
}
