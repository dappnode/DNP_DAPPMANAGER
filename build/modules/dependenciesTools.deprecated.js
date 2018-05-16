// dedicated functions
const getManifest = require('../getManifest');
const versionTools = require('./versionTools');

let getDep = async function (packageReq) {
  let dnpManifest = await getManifest(packageReq);
  return dnpManifest.dependencies;
}

let getNames = async function (packageName) {
  let dnpManifest = await getManifest(packageName);
  return Object.getOwnPropertyNames(dnpManifest.dependencies);
}

let getTree = async function (packageName) {
  let depObject = await getDep(packageName);
  let _depTree = {}

  for (const dep of Object.getOwnPropertyNames(depObject)) {
    _depTree[dep+'@'+depObject[dep]] = await getTree (dep+'@'+depObject[dep])
  }
  return _depTree;
}

let getAll = async function (packageReq) {
  let depObject = await getDep(packageReq);
  let _depList = [];
  for (const dep of Object.getOwnPropertyNames(depObject)) {
    _depList.push(dep+'@'+depObject[dep])
    _depList.push.apply(_depList, await getAll (dep+'@'+depObject[dep]))
  }
  return _depList;
}

let getAllResolved = async function (packageReq) {
  let dependencyList = await getAll (packageReq);
  // Delete duplicate dependencies
  dependencyList = uniqueArray(dependencyList).sort();
  // Resolve dependencies by comparing versions
  let depObjects = {}
  dependencyList.forEach(function(dep) {
    let name = dep.split('@')[0];
    let version = dep.split('@')[1];
    if (name in depObjects) {
      let _version = depObjects[name];
      depObjects[name] = versionTools.highestVersion(version, _version)
    } else {
      depObjects[name] = version
    }
  });
  let dependencyListResolved = Object.getOwnPropertyNames(depObjects).map((depName) => {
    return depName + '@' + depObjects[depName];
  })
  return dependencyListResolved;
}


// UTILS

function uniqueArray (arrArg) {
  return arrArg.filter(function(elem, pos,arr) {
    return arr.indexOf(elem) == pos;
  });
};

// EXPOSE FUNCTIONS
module.exports = {
  getDep,
  getNames,
  getTree,
  getAll,
  getAllResolved
}
