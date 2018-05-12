const directoryCalls = require('../modules/calls/directoryCalls')


async function listDirectory(req) {

    let packages = await directoryCalls.getDirectory()

    return JSON.stringify({
        success: true,
        message: "Listing " + packages.length + " packages",
        result: packages
    })

}


module.exports = listDirectory
