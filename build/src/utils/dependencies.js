const { highestVersion } = require('../utils/versions')
const { orderDependencies } = require('./orderDependencies')
const parse = require('./parse')


function createGetAllResolvedOrdered(getManifest, log = () => {}) {
  return async function getAllResolvedOrdered(packageReq) {

    log({clear: true, msg: 'fetching dependencies...'})
    let allResolvedDeps = await getAllResolved(packageReq, getManifest)
    // Dependencies will be ordered so they can be installed in series
    let allResolvedOrdered = orderDependencies(allResolvedDeps)
    log({order: allResolvedOrdered.map(p => p.name)})
    return allResolvedOrdered
  }
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

  let dependencyList = await getAll(packageReq, getManifest)
  // The dependecy list may contain the same package with different versions
  return resolveConflictingVersions(dependencyList)

}


async function getAll(packageReq, getManifest, packageList=[]) {
  // Expects packageReq = {name: packageName, ver: packageVersion}
  // >> Will attach the fetched manifest

  let manifest = await getManifest(packageReq);
  // Validate the input, manifests are not controlled by the dappnode team
  let depObject = parse.manifest.depObject(manifest)

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
    await getAll(subDepReq, getManifest, packageList)

  }

  // Add dep to the packageList
  packageList.push({
    name: packageReq.name,
    ver: packageReq.ver,
    dep: depObject,
    manifest: manifest
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
  createGetAllResolvedOrdered,
  getAll,
  getAllResolved,
  sortByNameKey,
  byUniqueObjects,
  resolveConflictingVersions
}
