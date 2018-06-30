const parse = require('../utils/parse');
const res = require('../utils/res');

// CALL DOCUMENTATION:
// > result = {}

function createInstallPackage(getAllDependenciesResolvedOrdered,
  download,
  run
) {
  return async function installPackage({id, logId}) {
    const packageReq = parse.packageReq(id);

    // Returns a list of unique dep (highest requested version) + requested package
    // > getManifest needs IPFS
    // > Returns an order to follow in order to install repecting dependencies
    let packageList = await getAllDependenciesResolvedOrdered({packageReq, logId});

    // -> install in paralel
    await Promise.all(packageList.map((pkg) => download({pkg, logId})));

    // -> run in serie
    for (const pkg of packageList) {
      await run({pkg, logId});
    }

    return res.success('Installed ' + packageReq.name + ' version: ' + packageReq.ver, {}, true);
  };
}


module.exports = createInstallPackage;
