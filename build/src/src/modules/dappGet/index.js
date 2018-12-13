const resolve = require('./resolve');
const aggregate = require('./aggregate');

/*
HOW TO USE:

    const dappGet = require('../index');

    const req = {
        name: 'core.dnp.dappnode.eth',
        ver: '/ipfs/Qmabuy2rTUEWA5jKyUKJmUDCH375e75tpUnAAwyi1PbLq1',
    };
    await dappGet.update(req);
    const res = await dappGet.resolve(req);

    result = {
        success: {
            'bind.dnp.dappnode.eth': '0.1.4',
            'ipfs.dnp.dappnode.eth': '0.1.3',
            'ethchain.dnp.dappnode.eth': '0.1.4',
            'ethforward.dnp.dappnode.eth': '0.1.1',
            'vpn.dnp.dappnode.eth': '0.1.11',
            'wamp.dnp.dappnode.eth': '0.1.0',
            'admin.dnp.dappnode.eth': '0.1.6',
            'dappmanager.dnp.dappnode.eth': '0.1.10',
            'core.dnp.dappnode.eth': '/ipfs/Qmabuy2rTUEWA5jKyUKJmUDCH375e75tpUnAAwyi1PbLq1'
        },
        message: 'Found compatible state with case 1/256'
    }

    <or>

    result = {
        success: false,
        message: 'Could not find a compatible state.
            Packages x.dnp.dappnode.eth request incompatible versions of y.dnp.dappnode.eth.
            Checked 256/256 possible states.'
    }

*/

async function dappGet(req) {
    const dnps = await aggregate(req);
    return resolve(dnps);
}

module.exports = dappGet;
