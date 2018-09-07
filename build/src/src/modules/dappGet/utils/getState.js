const dockerList = require('modules/dockerList');

async function getState() {
    let state = {};
    let dnpList = await dockerList.listContainers();
    dnpList.forEach((pkg) => {
        state[pkg.name] = pkg.version;
    });
    return state;
}

module.exports = getState;
