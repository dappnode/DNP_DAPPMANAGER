const dappGet = require('modules/dappGet');

init();

async function init() {
    const req = {
        name: 'nginx-proxy.dnp.dappnode.eth',
        ver: '0.0.3',
    };
    await dappGet.update(req);
    const result = await dappGet.resolve(req);
    console.log(result);
}
