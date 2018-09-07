const resolver = require('./resolver');
const fetch = require('./fetch');
const getState = require('./utils/getState');
const getRepo = require('./utils/getRepo');

/*
HOW TO USE:

    const dappGet = require('../index');

    const req = {
        name: 'core.dnp.dappnode.eth',
        ver: '/ipfs/Qmabuy2rTUEWA5jKyUKJmUDCH375e75tpUnAAwyi1PbLq1',
    };
    await dappGet.update(req);
    const res = await dappGet.resolve(req);

    res = {
        success: {
            'bind.dnp.dappnode.eth': '0.1.4',
            'ipfs.dnp.dappnode.eth': '0.1.3',
            'ethchain.dnp.dappnode.eth': '0.1.4',
            'ethforward.dnp.dappnode.eth': '0.1.1',
            'vpn.dnp.dappnode.eth': '0.1.11',
            'wamp.dnp.dappnode.eth': '0.1.0',
            'admin.dnp.dappnode.eth': '0.1.6',
            'dappmanager.dnp.dappnode.eth': '0.1.10',
            'core.dnp.dappnode.eth': '/ipfs/Qmabuy2rTUEWA5jKyUKJmUDCH375e75tpUnAAwyi1PbLq1' },
        errors: {
            'core.dnp.dappnode.eth@/ipfs/Qm...#bind.dnp.dappnode.eth@null#0.1.4': 128,
            'core.dnp.dappnode.eth@/ipfs/Qm...#ipfs.dnp.dappnode.eth@null#0.1.3': 64,
            'core.dnp.dappnode.eth@/ipfs/Qm...#ethchain.dnp.dappnode.eth@null#0.1.4': 32,
            'core.dnp.dappnode.eth@/ipfs/Qm...#ethforward.dnp.dappnode.eth@null#0.1.1': 16,
            'core.dnp.dappnode.eth@/ipfs/Qm...#vpn.dnp.dappnode.eth@null#0.1.11': 8,
            'core.dnp.dappnode.eth@/ipfs/Qm...#wamp.dnp.dappnode.eth@null#0.1.0': 4,
            'core.dnp.dappnode.eth@/ipfs/Qm...#admin.dnp.dappnode.eth@null#0.1.6': 2,
            'core.dnp.dappnode.eth@/ipfs/Qm...#dappmanager.dnp.dappnode.eth@null#0.1.10': 1
        },
        casesChecked: 255,
        totalCases: 256,
        hasTimedOut: false
    }

*/

// dappGet.update
async function update(req) {
    const state = await getState();
    await fetch({state, req});
}

// dappGet.resolve
async function resolve(req) {
    const state = await getState();
    const repo = await getRepo();
    return await resolver(req, repo, state);
}

module.exports = {
    update,
    resolve,
};
