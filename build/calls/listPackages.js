const dockerCalls = require('../modules/calls/dockerCalls')


async function listPackages(req) {

    let dnpList = await dockerCalls.listContainers()
    // Return
    return JSON.stringify({
        success: true,
        message: "Listing " + dnpList.length + " packages",
        result: dnpList
    })

}


module.exports = listPackages
