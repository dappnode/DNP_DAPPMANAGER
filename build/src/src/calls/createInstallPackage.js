const parse = require('utils/parse');

// CALL DOCUMENTATION:
// > kwargs: {
//     id,
//     logId
//   }
// > result: empty = {}

function createInstallPackage({
  getAllDependencies,
  download,
  run,
}) {
  const installPackage = async ({
    id,
    logId,
  }) => {
    const packageReq = parse.packageReq(id);

    // Returns a list of unique dep (highest requested version) + requested package
    // > getManifest needs IPFS
    // > Returns an order to follow in order to install repecting dependencies
    let packageList = await getAllDependencies({packageReq, logId});

    // -> install in paralel
    await Promise.all(packageList.map((pkg) => download({pkg, logId})));

    // -> run in serie
    for (const pkg of packageList) {
      await run({pkg, logId});
    }

    return {
      message: 'Installed ' + packageReq.name + ' version: ' + packageReq.ver,
      log: true,
    };
  };

  // Expose main method
  return installPackage;
}


module.exports = createInstallPackage;
