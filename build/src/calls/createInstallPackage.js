const parse = require('../utils/parse');
const res = require('../utils/res');

// CALL DOCUMENTATION:
// > result = {}

function createInstallPackage(getAllDependenciesResolvedOrdered,
  downloadPackages,
  runPackages
) {
  return async function installPackage({args, kwargs, log}) {
    const packageReq = parse.packageReq(args[0]);
    const logId = kwargs.logId;

    console.log('logID: '+logId);
    log('HELLO THIS IS PROGRESS');

    // Returns a list of unique dep (highest requested version) + requested package
    // > getManifest needs IPFS
    // > Returns an order to follow in order to install repecting dependencies
    let packageList = await getAllDependenciesResolvedOrdered(packageReq);
    console.log('\x1b[36m%s\x1b[0m', 'Finished getDeps');
    // -> install in paralel
    await downloadPackages(packageList);
    console.log('\x1b[36m%s\x1b[0m', 'Finished downloading');
    // -> run in serie
    await runPackages(packageList);
    console.log('\x1b[36m%s\x1b[0m', 'Finished running');

    return res.success('Installed ' + packageReq.name + ' version: ' + packageReq.ver, {}, true);
  };
}


module.exports = createInstallPackage;
